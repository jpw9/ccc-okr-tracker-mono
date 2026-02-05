package com.ccc.okrtracker.repository;

import com.ccc.okrtracker.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional; // ADDED Import

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    // We fetch all because we do in-memory filtering in frontend for tree
    // But specific queries can be added here

    // UPDATED: Case-insensitive email lookup
    @Query("SELECT u FROM User u WHERE LOWER(u.email) = LOWER(:email)")
    Optional<User> findByEmail(@Param("email") String email);
}