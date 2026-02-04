package com.ccc.okrtracker.service;

import com.ccc.okrtracker.entity.Role;
import com.ccc.okrtracker.entity.User;
import com.ccc.okrtracker.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.Collections;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    /**
     * Looks up the application User by the 'email' claim from the JWT and extracts application permissions.
     * Permissions are formatted as "PERMISSION_NAME" (e.g., "MANAGE_USERS") for Spring Security.
     * * @param jwt The authenticated JWT.
     * @return A collection of Spring Security GrantedAuthorities derived from the application user's roles.
     */
    public Collection<GrantedAuthority> mapJwtToAuthorities(Jwt jwt) {
        // Try multiple claims: email, preferred_username, or sub
        String email = jwt.getClaimAsString("email");
        if (email == null) {
            email = jwt.getClaimAsString("preferred_username");
        }
        if (email == null) {
            email = jwt.getClaimAsString("sub");
        }

        System.out.println("DEBUG: JWT Claims - email: " + jwt.getClaimAsString("email") + 
                         ", preferred_username: " + jwt.getClaimAsString("preferred_username") +
                         ", sub: " + jwt.getClaimAsString("sub"));

        if (email == null) {
            System.out.println("DEBUG: No email/username claim found in JWT");
            return Collections.emptyList();
        }

        // 1. Find the active application user by email
        Optional<User> userOptional = userRepository.findByEmail(email);

        if (userOptional.isEmpty()) {
            System.out.println("DEBUG: User not found in database for email: " + email);
            return Collections.emptyList();
        }

        if (!userOptional.get().getIsActive()) {
            System.out.println("DEBUG: User found but is inactive: " + email);
            return Collections.emptyList();
        }

        User user = userOptional.get();

        // 2. Extract all unique active permissions from all assigned roles
        Set<String> appPermissions = user.getRoles().stream()
                .filter(Role::getIsActive)
                .flatMap(role -> role.getPermissions().stream())
                .collect(Collectors.toSet());

        System.out.println("DEBUG: User " + email + " has permissions: " + appPermissions);

        // 3. Convert to Spring Security Authorities
        return appPermissions.stream()
                .map(SimpleGrantedAuthority::new)
                .collect(Collectors.toSet());
    }
}