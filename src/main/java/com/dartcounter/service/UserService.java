package com.dartcounter.service;

import com.dartcounter.entity.User;
import com.dartcounter.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    /**
     * Get or create a user from Auth0 JWT token.
     * Called on each authenticated request to ensure user exists in our database.
     */
    @Transactional
    public User getOrCreateUser(Jwt jwt) {
        String auth0Id = jwt.getSubject();
        String email = jwt.getClaimAsString("email");
        String name = jwt.getClaimAsString("name");
        String picture = jwt.getClaimAsString("picture");

        // Use email as name fallback
        if (name == null || name.isBlank()) {
            name = email != null ? email.split("@")[0] : "Player";
        }

        Optional<User> existingUser = userRepository.findByAuth0Id(auth0Id);

        if (existingUser.isPresent()) {
            User user = existingUser.get();
            user.updateLastLogin();
            user.updateProfile(name, picture);
            return userRepository.save(user);
        }

        // Create new user
        User newUser = new User(auth0Id, email, name, picture);
        return userRepository.save(newUser);
    }

    /**
     * Get user by Auth0 ID.
     */
    public Optional<User> findByAuth0Id(String auth0Id) {
        return userRepository.findByAuth0Id(auth0Id);
    }

    /**
     * Get user by internal UUID.
     */
    public Optional<User> findById(UUID id) {
        return userRepository.findById(id);
    }

    /**
     * Update user's display name.
     */
    @Transactional
    public User updateDisplayName(String auth0Id, String newName) {
        User user = userRepository.findByAuth0Id(auth0Id)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));

        user.setName(newName);
        return userRepository.save(user);
    }
}
