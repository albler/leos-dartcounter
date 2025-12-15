package com.dartcounter.controller;

import com.dartcounter.dto.CreateSessionRequest;
import com.dartcounter.dto.ErrorResponse;
import com.dartcounter.dto.GameStateDTO;
import com.dartcounter.dto.JoinSessionRequest;
import com.dartcounter.entity.GameSession;
import com.dartcounter.service.GameSessionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/sessions")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class SessionController {

    private final GameSessionService sessionService;

    @PostMapping
    public ResponseEntity<GameStateDTO> createSession(@Valid @RequestBody CreateSessionRequest request) {
        log.info("Creating new session with {} players", request.getPlayerNames().size());
        GameSession session = sessionService.createSession(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(GameStateDTO.from(session));
    }

    @GetMapping("/{code}")
    public ResponseEntity<GameStateDTO> getSession(@PathVariable String code) {
        log.info("Getting session {}", code);
        GameSession session = sessionService.getSession(code);
        return ResponseEntity.ok(GameStateDTO.from(session));
    }

    @PostMapping("/{code}/join")
    public ResponseEntity<GameStateDTO> joinSession(
            @PathVariable String code,
            @RequestBody(required = false) JoinSessionRequest request) {
        log.info("Joining session {}", code);
        GameSession session = sessionService.joinSession(code);
        return ResponseEntity.ok(GameStateDTO.from(session));
    }

    @PostMapping("/{code}/start")
    public ResponseEntity<GameStateDTO> startGame(@PathVariable String code) {
        log.info("Starting game for session {}", code);
        GameSession session = sessionService.startGame(code);
        return ResponseEntity.ok(GameStateDTO.from(session));
    }

    @PostMapping("/{code}/reset")
    public ResponseEntity<GameStateDTO> resetGame(@PathVariable String code) {
        log.info("Resetting game for session {}", code);
        GameStateDTO state = sessionService.resetGame(code);
        return ResponseEntity.ok(state);
    }

    @DeleteMapping("/{code}")
    public ResponseEntity<Void> deleteSession(@PathVariable String code) {
        log.info("Deleting session {}", code);
        sessionService.deleteSession(code);
        return ResponseEntity.noContent().build();
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(IllegalArgumentException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(new ErrorResponse("NOT_FOUND", ex.getMessage()));
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ErrorResponse> handleBadState(IllegalStateException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(new ErrorResponse("BAD_REQUEST", ex.getMessage()));
    }
}
