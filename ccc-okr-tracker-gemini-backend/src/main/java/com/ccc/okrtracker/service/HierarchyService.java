package com.ccc.okrtracker.service;

import com.ccc.okrtracker.entity.*;
import com.ccc.okrtracker.exception.ResourceNotFoundException;
import com.ccc.okrtracker.repository.*;
import lombok.RequiredArgsConstructor;
import org.hibernate.Hibernate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class HierarchyService {

    private static final Logger logger = LoggerFactory.getLogger(HierarchyService.class);

    private final ProjectRepository projectRepo;
    private final StrategicInitiativeRepository initRepo;
    private final GoalRepository goalRepo;
    private final ObjectiveRepository objectiveRepo;
    private final KeyResultRepository krRepo;
    private final ActionItemRepository aiRepo;
    private final CalculationService calculationService;
    private final UserRepository userRepository;
    private final ProjectAccessService projectAccessService;

    /**
     * Retrieves the currently authenticated user from Spring Security context.
     * Extracts the email claim from JWT and looks up the User entity.
     * 
     * @return The authenticated User entity
     * @throws ResourceNotFoundException if user is not found in database
     */
    private User getCurrentAuthenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResourceNotFoundException("No authenticated user found");
        }

        // Extract email from JWT token
        final String userIdentifier;
        if (authentication.getPrincipal() instanceof Jwt jwt) {
            String email = jwt.getClaimAsString("email");
            if (email != null) {
                userIdentifier = email;
            } else {
                String username = jwt.getClaimAsString("preferred_username");
                userIdentifier = username != null ? username : jwt.getSubject();
            }
        } else {
            userIdentifier = authentication.getName();
        }

        if (userIdentifier == null) {
            throw new ResourceNotFoundException("Could not extract user identifier from authentication");
        }

        // Look up user by email
        return userRepository.findByEmail(userIdentifier)
                .filter(User::getIsActive)
                .orElseThrow(() -> new ResourceNotFoundException("User not found or inactive: " + userIdentifier));
    }

    /**
     * Helper method to get the current user's login string for audit fields.
     * Falls back to "system" if no authenticated user is found.
     * 
     * @return The user's login identifier or "system"
     */
    private String getCurrentUserLogin() {
        try {
            User user = getCurrentAuthenticatedUser();
            return user.getEmail();
        } catch (Exception e) {
            return "system"; // Fallback for system operations or unauthenticated contexts
        }
    }

    /**
     * Get all projects filtered by user's access permissions.
     * Uses ProjectAccessService to determine accessible project IDs.
     */
    public List<Project> getAllProjects() {
        User currentUser = getCurrentAuthenticatedUser();
        Set<Long> accessibleIds = projectAccessService.getAccessibleProjectIds(currentUser);
        
        if (accessibleIds.isEmpty()) {
            return List.of();
        }
        
        return projectRepo.findByIdInAndIsActiveTrue(accessibleIds);
    }

    /**
     * Get all projects without access filtering (for admin purposes).
     */
    public List<Project> getAllProjectsUnfiltered() {
        return projectRepo.findByIsActiveTrue();
    }

    // --- Add Methods ---

    @Transactional
    public Project createProject(Project project) {
        return projectRepo.save(project);
    }

    @Transactional
    public StrategicInitiative addInitiative(Long projectId, StrategicInitiative init) {
        Project p = projectRepo.findById(projectId).orElseThrow(() -> new ResourceNotFoundException("Project not found"));
        init.setProject(p);
        StrategicInitiative saved = initRepo.save(init);
        calculationService.recalculateProject(projectId);
        return saved;
    }

    @Transactional
    public Goal addGoal(Long initId, Goal goal) {
        StrategicInitiative init = initRepo.findById(initId).orElseThrow(() -> new ResourceNotFoundException("Initiative not found"));
        goal.setInitiative(init);
        Goal saved = goalRepo.save(goal);
        calculationService.recalculateProject(init.getProject().getId());
        return saved;
    }

    @Transactional
    public Objective addObjective(Long goalId, Objective obj) {
        Goal g = goalRepo.findById(goalId).orElseThrow(() -> new ResourceNotFoundException("Goal not found"));
        obj.setGoal(g);
        Objective saved = objectiveRepo.save(obj);
        calculationService.recalculateProject(g.getInitiative().getProject().getId());
        return saved;
    }

    @Transactional
    public KeyResult addKeyResult(Long objId, KeyResult kr) {
        Objective obj = objectiveRepo.findById(objId).orElseThrow(() -> new ResourceNotFoundException("Objective not found"));
        kr.setObjective(obj);
        KeyResult saved = krRepo.save(kr);
        calculationService.recalculateProject(obj.getGoal().getInitiative().getProject().getId());
        return saved;
    }

    @Transactional
    public ActionItem addActionItem(Long krId, ActionItem ai) {
        KeyResult kr = krRepo.findById(krId).orElseThrow(() -> new ResourceNotFoundException("KR not found"));
        ai.setKeyResult(kr);

        // Ensure consistency between progress and isCompleted upon creation
        Integer progress = ai.getProgress();
        Boolean isCompleted = ai.getIsCompleted();
        
        if (progress != null && progress == 100) {
            ai.setIsCompleted(true);
        } else if (progress != null && progress < 100) {
            ai.setIsCompleted(false);
        } else if (Boolean.TRUE.equals(isCompleted)) {
            ai.setProgress(100);
        } else {
            ai.setProgress(0);
            ai.setIsCompleted(false);
        }

        ActionItem saved = aiRepo.save(ai);
        calculationService.recalculateProject(kr.getObjective().getGoal().getInitiative().getProject().getId());
        return saved;
    }

    // --- Update Methods (PUT) ---

    @Transactional
    public Project updateProject(Long id, Project updates) {
        Project p = projectRepo.findById(id).orElseThrow(() -> new ResourceNotFoundException("Project not found"));

        Optional.ofNullable(updates.getTitle()).ifPresent(p::setTitle);
        Optional.ofNullable(updates.getDescription()).ifPresent(p::setDescription);
        Optional.ofNullable(updates.getProgress()).ifPresent(p::setProgress);

        if (updates.getIsActive() != null && !updates.getIsActive()) {
            p.softDelete(getCurrentUserLogin());
            cascadeSoftDelete(p, false);
        } else if (updates.getIsActive() != null && updates.getIsActive()) {
            p.restore();
        }

        projectRepo.save(p);
        calculationService.recalculateProject(id);
        return p;
    }

    @Transactional
    public StrategicInitiative updateStrategicInitiative(Long id, StrategicInitiative updates) {
        StrategicInitiative init = initRepo.findById(id).orElseThrow(() -> new ResourceNotFoundException("Initiative not found"));

        Optional.ofNullable(updates.getTitle()).ifPresent(init::setTitle);
        Optional.ofNullable(updates.getDescription()).ifPresent(init::setDescription);
        Optional.ofNullable(updates.getProgress()).ifPresent(init::setProgress);

        if (updates.getIsActive() != null && !updates.getIsActive()) {
            init.softDelete(getCurrentUserLogin());
            cascadeSoftDelete(init, false);
        } else if (updates.getIsActive() != null && updates.getIsActive()) {
            init.restore();
        }

        initRepo.save(init);
        Long projectId = init.getProject().getId();
        calculationService.recalculateProject(projectId);
        return init;
    }

    @Transactional
    public Goal updateGoal(Long id, Goal updates) {
        Goal g = goalRepo.findById(id).orElseThrow(() -> new ResourceNotFoundException("Goal not found"));

        Optional.ofNullable(updates.getTitle()).ifPresent(g::setTitle);
        Optional.ofNullable(updates.getDescription()).ifPresent(g::setDescription);
        Optional.ofNullable(updates.getProgress()).ifPresent(g::setProgress);

        // Get projectId BEFORE soft delete to avoid detached entity issues
        Long projectId = g.getInitiative().getProject().getId();

        if (updates.getIsActive() != null && !updates.getIsActive()) {
            g.softDelete(getCurrentUserLogin());
            cascadeSoftDelete(g, false);
        } else if (updates.getIsActive() != null && updates.getIsActive()) {
            g.restore();
        }

        goalRepo.save(g);
        calculationService.recalculateProject(projectId);
        return g;
    }

    @Transactional
    public Objective updateObjective(Long id, Objective updates) {
        Objective obj = objectiveRepo.findById(id).orElseThrow(() -> new ResourceNotFoundException("Objective not found"));

        Optional.ofNullable(updates.getTitle()).ifPresent(obj::setTitle);
        Optional.ofNullable(updates.getDescription()).ifPresent(obj::setDescription);
        Optional.ofNullable(updates.getAssignee()).ifPresent(obj::setAssignee);
        Optional.ofNullable(updates.getYear()).ifPresent(obj::setYear);
        Optional.ofNullable(updates.getQuarter()).ifPresent(obj::setQuarter);
        Optional.ofNullable(updates.getDueDate()).ifPresent(obj::setDueDate);
        Optional.ofNullable(updates.getProgress()).ifPresent(obj::setProgress);

        // Get projectId BEFORE soft delete to avoid detached entity issues
        Long projectId = obj.getGoal().getInitiative().getProject().getId();

        if (updates.getIsActive() != null && !updates.getIsActive()) {
            obj.softDelete(getCurrentUserLogin());
            cascadeSoftDelete(obj, false);
        } else if (updates.getIsActive() != null && updates.getIsActive()) {
            obj.restore();
        }

        objectiveRepo.save(obj);
        calculationService.recalculateProject(projectId);
        return obj;
    }

    @Transactional
    public KeyResult updateKeyResult(Long id, KeyResult updates) {
        KeyResult kr = krRepo.findById(id).orElseThrow(() -> new ResourceNotFoundException("Key Result not found"));

        Integer originalProgress = kr.getProgress();
        
        Optional.ofNullable(updates.getTitle()).ifPresent(kr::setTitle);
        Optional.ofNullable(updates.getDescription()).ifPresent(kr::setDescription);
        Optional.ofNullable(updates.getAssignee()).ifPresent(kr::setAssignee);
        Optional.ofNullable(updates.getDueDate()).ifPresent(kr::setDueDate);
        Optional.ofNullable(updates.getProgress()).ifPresent(kr::setProgress);
        
        boolean needsRecalculation = false;
        
        boolean progressChanged = updates.getProgress() != null && 
                                 !updates.getProgress().equals(originalProgress);
        
        if (progressChanged) {
            kr.setManualProgressSet(true);
            needsRecalculation = true;
        }

        // Get projectId BEFORE soft delete to avoid detached entity issues
        Long projectId = kr.getObjective().getGoal().getInitiative().getProject().getId();

        if (updates.getIsActive() != null && !updates.getIsActive()) {
            kr.softDelete(getCurrentUserLogin());
            cascadeSoftDelete(kr, false);
            needsRecalculation = true;
        } else if (updates.getIsActive() != null && updates.getIsActive()) {
            kr.restore();
            needsRecalculation = true;
        }

        krRepo.save(kr);
        
        if (needsRecalculation) {
            calculationService.recalculateProject(projectId);
        }
        
        return kr;
    }

    @Transactional
    public ActionItem updateActionItem(Long id, ActionItem updates) {
        ActionItem ai = aiRepo.findById(id).orElseThrow(() -> new ResourceNotFoundException("Action Item not found"));
        
        Optional.ofNullable(updates.getTitle()).ifPresent(ai::setTitle);
        Optional.ofNullable(updates.getDescription()).ifPresent(ai::setDescription);
        Optional.ofNullable(updates.getDueDate()).ifPresent(ai::setDueDate);
        Optional.ofNullable(updates.getAssignee()).ifPresent(ai::setAssignee);

        Integer incomingProgress = updates.getProgress();
        Boolean incomingIsCompleted = updates.getIsCompleted();
        
        if (incomingProgress != null && incomingProgress > 0) {
            ai.setProgress(incomingProgress);
            ai.setIsCompleted(incomingProgress >= 100);
        } else if (incomingIsCompleted != null) {
            ai.setIsCompleted(incomingIsCompleted);
            ai.setProgress(incomingIsCompleted ? 100 : 0);
        }

        if (updates.getIsActive() != null && !updates.getIsActive()) {
            ai.softDelete(getCurrentUserLogin());
        } else if (updates.getIsActive() != null && updates.getIsActive()) {
            ai.restore();
        }

        // Final consistency check
        if (ai.getProgress() != null && ai.getProgress() == 100 && !Boolean.TRUE.equals(ai.getIsCompleted())) {
            ai.setIsCompleted(true);
        } else if (ai.getProgress() != null && ai.getProgress() < 100 && Boolean.TRUE.equals(ai.getIsCompleted())) {
            ai.setIsCompleted(false);
        }

        // Cache KR ID and project ID before saving
        Long krId = ai.getKeyResult() != null ? ai.getKeyResult().getId() : null;

        aiRepo.save(ai);
        
        if (krId != null) {
            KeyResult kr = krRepo.findById(krId).orElse(null);
            if (kr != null) {
                // UNLOCK the KR so it recalculates from action items
                kr.setManualProgressSet(false);
                krRepo.save(kr);
                
                Long projectId = kr.getObjective().getGoal().getInitiative().getProject().getId();
                calculationService.recalculateProject(projectId);
            }
        }
        
        return ai;
    }

    // --- New Recursive Helper for Soft Delete/Restore ---

    /**
     * Recursively applies soft-delete (isActive=false) or restore (isActive=true)
     * to all hierarchical descendants of the given parent entity.
     * NOTE: This method only processes CHILDREN, not the parent itself (parent is handled by caller).
     * @param parent The parent entity (Project, Initiative, Goal, Objective, KeyResult)
     * @param restore If true, restores the entities (isActive=true); otherwise soft-deletes (isActive=false).
     */
    private void cascadeSoftDelete(BaseEntity parent, boolean restore) {
        String currentUser = getCurrentUserLogin();
        
        // Recursively apply to children (NOT to parent - parent is handled by caller)
        if (parent instanceof Project) {
            Project p = (Project) parent;
            // Initialize lazy collection before iterating
            Hibernate.initialize(p.getInitiatives());
            for (StrategicInitiative init : p.getInitiatives()) {
                if (!restore) init.softDelete(currentUser); else init.restore();
                initRepo.save(init);
                cascadeSoftDelete(init, restore);
            }
        } else if (parent instanceof StrategicInitiative) {
            StrategicInitiative init = (StrategicInitiative) parent;
            // Initialize lazy collection before iterating
            Hibernate.initialize(init.getGoals());
            for (Goal goal : init.getGoals()) {
                if (!restore) goal.softDelete(currentUser); else goal.restore();
                goalRepo.save(goal);
                cascadeSoftDelete(goal, restore);
            }
        } else if (parent instanceof Goal) {
            Goal g = (Goal) parent;
            // Initialize lazy collection before iterating
            Hibernate.initialize(g.getObjectives());
            for (Objective obj : g.getObjectives()) {
                if (!restore) obj.softDelete(currentUser); else obj.restore();
                objectiveRepo.save(obj);
                cascadeSoftDelete(obj, restore);
            }
        } else if (parent instanceof Objective) {
            Objective obj = (Objective) parent;
            // Initialize lazy collection before iterating
            Hibernate.initialize(obj.getKeyResults());
            for (KeyResult kr : obj.getKeyResults()) {
                if (!restore) kr.softDelete(currentUser); else kr.restore();
                krRepo.save(kr);
                cascadeSoftDelete(kr, restore);
            }
        } else if (parent instanceof KeyResult) {
            KeyResult kr = (KeyResult) parent;
            // Initialize lazy collection before iterating
            Hibernate.initialize(kr.getActionItems());
            for (ActionItem ai : kr.getActionItems()) {
                if (!restore) ai.softDelete(currentUser); else ai.restore();
                aiRepo.save(ai);
            }
        }
    }
}