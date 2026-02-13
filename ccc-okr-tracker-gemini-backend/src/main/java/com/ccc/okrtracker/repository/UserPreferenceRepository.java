package com.ccc.okrtracker.repository;

import com.ccc.okrtracker.entity.UserPreference;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserPreferenceRepository extends JpaRepository<UserPreference, Long> {

    List<UserPreference> findByUserId(Long userId);

    Optional<UserPreference> findByUserIdAndPreferenceKey(Long userId, String preferenceKey);

    void deleteByUserIdAndPreferenceKey(Long userId, String preferenceKey);
}
