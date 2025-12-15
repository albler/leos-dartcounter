package com.dartcounter.controller;

import com.dartcounter.dto.GameStateDTO;
import com.dartcounter.dto.ThrowRequest;
import com.dartcounter.service.GameSessionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
@Slf4j
public class GameWebSocketController {

    private final GameSessionService sessionService;
    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/session/{code}/throw")
    @SendTo("/topic/session/{code}")
    public GameStateDTO handleThrow(
            @DestinationVariable String code,
            ThrowRequest request) {
        log.info("Throw received for session {}: {} points", code, request.getPoints());
        try {
            return sessionService.processThrow(code, request);
        } catch (Exception e) {
            log.error("Error processing throw for session {}: {}", code, e.getMessage());
            return createErrorState(code, e.getMessage());
        }
    }

    @MessageMapping("/session/{code}/undo")
    @SendTo("/topic/session/{code}")
    public GameStateDTO handleUndo(@DestinationVariable String code) {
        log.info("Undo requested for session {}", code);
        try {
            return sessionService.undoLastThrow(code);
        } catch (Exception e) {
            log.error("Error undoing throw for session {}: {}", code, e.getMessage());
            return createErrorState(code, e.getMessage());
        }
    }

    @MessageMapping("/session/{code}/next")
    @SendTo("/topic/session/{code}")
    public GameStateDTO handleNextPlayer(@DestinationVariable String code) {
        log.info("Next player requested for session {}", code);
        try {
            return sessionService.nextPlayer(code);
        } catch (Exception e) {
            log.error("Error advancing player for session {}: {}", code, e.getMessage());
            return createErrorState(code, e.getMessage());
        }
    }

    @MessageMapping("/session/{code}/reset")
    @SendTo("/topic/session/{code}")
    public GameStateDTO handleReset(@DestinationVariable String code) {
        log.info("Reset requested for session {}", code);
        try {
            return sessionService.resetGame(code);
        } catch (Exception e) {
            log.error("Error resetting game for session {}: {}", code, e.getMessage());
            return createErrorState(code, e.getMessage());
        }
    }

    @MessageMapping("/session/{code}/start")
    @SendTo("/topic/session/{code}")
    public GameStateDTO handleStart(@DestinationVariable String code) {
        log.info("Start game requested for session {}", code);
        try {
            var session = sessionService.startGame(code);
            return GameStateDTO.from(session, "Game started!");
        } catch (Exception e) {
            log.error("Error starting game for session {}: {}", code, e.getMessage());
            return createErrorState(code, e.getMessage());
        }
    }

    @MessageMapping("/session/{code}/sync")
    @SendTo("/topic/session/{code}")
    public GameStateDTO handleSync(@DestinationVariable String code) {
        log.info("Sync requested for session {}", code);
        try {
            var session = sessionService.getSession(code);
            return GameStateDTO.from(session);
        } catch (Exception e) {
            log.error("Error syncing session {}: {}", code, e.getMessage());
            return createErrorState(code, e.getMessage());
        }
    }

    private GameStateDTO createErrorState(String code, String errorMessage) {
        return GameStateDTO.builder()
            .sessionCode(code)
            .message("Error: " + errorMessage)
            .build();
    }

    /**
     * Broadcasts a state update to all clients subscribed to a session.
     * Can be called from other services when needed.
     */
    public void broadcastState(String sessionCode, GameStateDTO state) {
        messagingTemplate.convertAndSend("/topic/session/" + sessionCode, state);
    }
}
