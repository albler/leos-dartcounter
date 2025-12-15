package com.dartcounter.controller;

import com.dartcounter.dto.UserStatsDTO;
import com.dartcounter.entity.User;
import com.dartcounter.service.StatsService;
import com.dartcounter.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/stats")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class StatsController {

    private final StatsService statsService;
    private final UserService userService;

    /**
     * Get the current user's statistics.
     */
    @GetMapping("/me")
    public ResponseEntity<UserStatsDTO> getMyStats(@AuthenticationPrincipal Jwt jwt) {
        User user = userService.getOrCreateUser(jwt);
        UserStatsDTO stats = statsService.getUserStats(user);
        return ResponseEntity.ok(stats);
    }
}
