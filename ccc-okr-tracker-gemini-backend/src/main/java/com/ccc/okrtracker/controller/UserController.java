package com.ccc.okrtracker.controller;

import com.ccc.okrtracker.entity.User;
import com.ccc.okrtracker.entity.UserPreference;
import com.ccc.okrtracker.repository.UserPreferenceRepository;
import com.ccc.okrtracker.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final UserPreferenceRepository userPreferenceRepository;

    /**
     * Endpoint to fetch the application's User entity for the currently authenticated Keycloak user.
     * Used by the frontend for roles/permissions mapping.
     */
    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()") // Only requires successful JWT authentication
    public ResponseEntity<User> getCurrentUser(Authentication authentication) {
        if (authentication.getPrincipal() instanceof Jwt jwt) {
            String email = jwt.getClaimAsString("email");

            Optional<User> user = userRepository.findByEmail(email);

            return user.map(ResponseEntity::ok)
                    .orElseGet(() -> ResponseEntity.notFound().build());
        }

        return ResponseEntity.badRequest().build();
    }

    /**
     * Endpoint to fetch all active users. Used for assignment dropdowns in hierarchy views.
     * Requires only basic authentication, not MANAGE_USERS permission.
     */
    @GetMapping("/all")
    @PreAuthorize("isAuthenticated()")
    public List<User> getAllUsersForAssignment() {
        return userRepository.findAll().stream()
                .filter(User::getIsActive)
                .collect(Collectors.toList());
    }

    // --- Helper: Resolve current user from JWT ---
    private Optional<User> resolveCurrentUser(Authentication authentication) {
        if (authentication.getPrincipal() instanceof Jwt jwt) {
            String email = jwt.getClaimAsString("email");
            if (email != null) {
                Optional<User> user = userRepository.findByEmail(email);
                if (user.isPresent()) return user;
            }
            String username = jwt.getClaimAsString("preferred_username");
            if (username != null) {
                return userRepository.findByLogin(username);
            }
        }
        return Optional.empty();
    }

    // --- User Preferences ---

    /**
     * GET /api/user/preferences — Returns all preferences for the current user as a key-value map.
     */
    @GetMapping("/preferences")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, String>> getPreferences(Authentication authentication) {
        Optional<User> userOpt = resolveCurrentUser(authentication);
        if (userOpt.isEmpty()) return ResponseEntity.notFound().build();

        List<UserPreference> prefs = userPreferenceRepository.findByUserId(userOpt.get().getId());
        Map<String, String> result = prefs.stream()
                .collect(Collectors.toMap(UserPreference::getPreferenceKey, UserPreference::getPreferenceValue));

        return ResponseEntity.ok(result);
    }

    /**
     * PUT /api/user/preferences — Bulk upsert preferences from a key-value map.
     */
    @PutMapping("/preferences")
    @PreAuthorize("isAuthenticated()")
    @Transactional
    public ResponseEntity<Map<String, String>> updatePreferences(
            @RequestBody Map<String, String> preferences,
            Authentication authentication) {

        Optional<User> userOpt = resolveCurrentUser(authentication);
        if (userOpt.isEmpty()) return ResponseEntity.notFound().build();

        Long userId = userOpt.get().getId();

        for (Map.Entry<String, String> entry : preferences.entrySet()) {
            String key = entry.getKey();
            String value = entry.getValue();

            Optional<UserPreference> existing = userPreferenceRepository.findByUserIdAndPreferenceKey(userId, key);
            if (existing.isPresent()) {
                existing.get().setPreferenceValue(value);
                // Hibernate dirty-checking will persist the change
            } else {
                UserPreference pref = UserPreference.builder()
                        .userId(userId)
                        .preferenceKey(key)
                        .preferenceValue(value)
                        .build();
                userPreferenceRepository.save(pref);
            }
        }

        // Return updated state
        List<UserPreference> updated = userPreferenceRepository.findByUserId(userId);
        Map<String, String> result = updated.stream()
                .collect(Collectors.toMap(UserPreference::getPreferenceKey, UserPreference::getPreferenceValue));

        return ResponseEntity.ok(result);
    }
}