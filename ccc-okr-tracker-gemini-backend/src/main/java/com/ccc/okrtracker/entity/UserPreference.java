package com.ccc.okrtracker.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_preferences", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"user_id", "preference_key"})
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UserPreference {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "preference_key", nullable = false, length = 100)
    private String preferenceKey;

    @Column(name = "preference_value", length = 500)
    private String preferenceValue;

    @Column(name = "updated_date")
    private LocalDateTime updatedDate;

    @PrePersist
    @PreUpdate
    public void onUpdate() {
        this.updatedDate = LocalDateTime.now();
    }

    // --- Well-known preference keys ---
    public static final String KEY_DEFAULT_PROJECT_ID = "defaultProjectId";
    public static final String KEY_DEFAULT_LANDING_PAGE = "defaultLandingPage";
    public static final String KEY_SIDEBAR_COLLAPSED = "sidebarCollapsed";
}
