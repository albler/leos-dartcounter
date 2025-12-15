package com.dartcounter.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String auth0Id;  // The 'sub' claim from Auth0 JWT

    @Column
    private String email;  // May be null depending on Auth0 connection

    @Column(nullable = false)
    private String name;

    @Column
    private String pictureUrl;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime lastLoginAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        lastLoginAt = LocalDateTime.now();
    }

    public User(String auth0Id, String email, String name, String pictureUrl) {
        this.auth0Id = auth0Id;
        this.email = email;
        this.name = name;
        this.pictureUrl = pictureUrl;
    }

    public void updateLastLogin() {
        this.lastLoginAt = LocalDateTime.now();
    }

    public void updateProfile(String name, String pictureUrl) {
        if (name != null) this.name = name;
        if (pictureUrl != null) this.pictureUrl = pictureUrl;
    }
}
