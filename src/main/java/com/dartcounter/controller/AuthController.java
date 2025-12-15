package com.dartcounter.controller;

import com.dartcounter.dto.UserDTO;
import com.dartcounter.entity.User;
import com.dartcounter.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AuthController {

    private final UserService userService;

    /**
     * Get the current authenticated user's profile.
     * Creates the user in our database if they don't exist yet.
     * This should be called after login to ensure the user is registered.
     */
    @GetMapping("/me")
    public ResponseEntity<UserDTO> getCurrentUser(@AuthenticationPrincipal Jwt jwt) {
        User user = userService.getOrCreateUser(jwt);
        return ResponseEntity.ok(UserDTO.from(user));
    }

    /**
     * Update the current user's display name.
     */
    @PutMapping("/me/name")
    public ResponseEntity<UserDTO> updateDisplayName(
            @AuthenticationPrincipal Jwt jwt,
            @RequestBody Map<String, String> body) {

        String newName = body.get("name");
        if (newName == null || newName.isBlank()) {
            return ResponseEntity.badRequest().build();
        }

        User user = userService.updateDisplayName(jwt.getSubject(), newName);
        return ResponseEntity.ok(UserDTO.from(user));
    }

    /**
     * Simple endpoint to verify the token is valid.
     * Returns basic token info for debugging.
     */
    @GetMapping("/verify")
    public ResponseEntity<Map<String, Object>> verifyToken(@AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(Map.of(
            "valid", true,
            "subject", jwt.getSubject(),
            "email", jwt.getClaimAsString("email") != null ? jwt.getClaimAsString("email") : "N/A",
            "expiresAt", jwt.getExpiresAt().toString()
        ));
    }
}
