// File: jpw9/ccc-okr-tracker-gemini-backend/ccc-okr-tracker-gemini-backend-2133aa9e882f23bca9d8c21e07a747afb8685989/src/main/java/com/ccc/okrtracker/service/CalculationService.java

package com.ccc.okrtracker.service;

import com.ccc.okrtracker.entity.*;
import com.ccc.okrtracker.repository.*;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.hibernate.Hibernate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CalculationService {

    private static final Logger logger = LoggerFactory.getLogger(CalculationService.class);

    private final ProjectRepository projectRepository;
    private final KeyResultRepository krRepository;
    private final ObjectiveRepository objectiveRepository;
    private final GoalRepository goalRepository;
    private final StrategicInitiativeRepository initiativeRepository;
    private final EntityManager entityManager;

    // Helper to safely extract Integer progress, defaulting to 0 if null
    private int safeProgress(Integer progress) {
        return Optional.ofNullable(progress).orElse(0);
    }

    @Transactional
    public void recalculateProject(Long projectId) {
        logger.debug("Recalculate project start: projectId={}", projectId);
        
        // Synchronize any pending changes to database before refreshing
        try {
            entityManager.flush();
        } catch (Exception e) {
            logger.warn("Failed to flush before recalculation, continuing anyway: {}", e.getMessage());
        }
        
        // Fetch project (benefits from L1 cache or batch fetching)
        Project project = projectRepository.findById(projectId).orElseThrow();
        
        // Refresh the entity to get fresh data without clearing the entire persistence context
        entityManager.refresh(project);

        // Force initialization of lazy collections at all levels
        // With @BatchSize(50), these will batch-load instead of N+1
        Hibernate.initialize(project.getInitiatives());
        
        for (StrategicInitiative init : project.getInitiatives()) {
            Hibernate.initialize(init.getGoals());
            for (Goal goal : init.getGoals()) {
                Hibernate.initialize(goal.getObjectives());
                for (Objective obj : goal.getObjectives()) {
                    Hibernate.initialize(obj.getKeyResults());
                    for (KeyResult kr : obj.getKeyResults()) {
                        Hibernate.initialize(kr.getActionItems());
                    }
                }
            }
        }
        
        // Calculate progress bottom-up
        // All entities are managed by Hibernate within this @Transactional method,
        // so setProgress() will be auto-flushed at commit — no individual save() needed.
        int projTotal = 0;
        int initCount = 0;

        for (StrategicInitiative init : project.getInitiatives()) {
            if (!init.getIsActive()) continue;

            int initTotal = 0;
            int goalCount = 0;

            for (Goal goal : init.getGoals()) {
                if (!goal.getIsActive()) continue;

                int goalTotal = 0;
                int objCount = 0;

                for (Objective obj : goal.getObjectives()) {
                    if (!obj.getIsActive()) continue;

                    int objTotal = 0;
                    int krCount = 0;

                    for (KeyResult kr : obj.getKeyResults()) {
                        if (!kr.getIsActive()) continue;

                        int krProgress = 0;
                        boolean manuallySet = kr.getManualProgressSet() != null && kr.getManualProgressSet();
                        
                        if (manuallySet) {
                            krProgress = safeProgress(kr.getProgress());
                        } else {
                            long activeAiCount = kr.getActionItems().stream()
                                    .filter(ai -> ai != null)
                                    .filter(BaseEntity::getIsActive)
                                    .count();

                            if (activeAiCount > 0) {
                                double aiSum = kr.getActionItems().stream()
                                        .filter(ai -> ai != null)
                                        .filter(BaseEntity::getIsActive)
                                        .mapToInt(ai -> safeProgress(ai.getProgress()))
                                        .sum();
                                krProgress = (int) Math.min(100, Math.round(aiSum / activeAiCount));
                            } else if (kr.getActionItems().stream().anyMatch(ai -> ai != null)) {
                                krProgress = 0;
                            } else {
                                krProgress = safeProgress(kr.getProgress());
                            }
                        }

                        kr.setProgress(krProgress);
                        objTotal += krProgress; 
                        krCount++;
                    }

                    int newObjProgress = (krCount > 0) ? Math.round((float) objTotal / krCount) : 0;
                    obj.setProgress(newObjProgress);
                    goalTotal += newObjProgress;
                    objCount++;
                }

                int newGoalProgress = (objCount > 0) ? Math.round((float) goalTotal / objCount) : 0;
                goal.setProgress(newGoalProgress);
                initTotal += newGoalProgress;
                goalCount++;
            }

            int newInitProgress = (goalCount > 0) ? Math.round((float) initTotal / goalCount) : 0;
            init.setProgress(newInitProgress);
            projTotal += newInitProgress;
            initCount++;
        }

        if (initCount > 0) {
            project.setProgress(Math.round((float) projTotal / initCount));
        }
        
        logger.debug("Recalculate project end: projectId={}", projectId);
    }
}