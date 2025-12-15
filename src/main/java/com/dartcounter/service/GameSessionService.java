package com.dartcounter.service;

import com.dartcounter.dto.CreateSessionRequest;
import com.dartcounter.dto.GameStateDTO;
import com.dartcounter.dto.ThrowRequest;
import com.dartcounter.entity.GameSession;
import com.dartcounter.entity.GameStatus;
import com.dartcounter.entity.Player;
import com.dartcounter.entity.ThrowHistory;
import com.dartcounter.repository.GameSessionRepository;
import com.dartcounter.repository.ThrowHistoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class GameSessionService {

    private final GameSessionRepository sessionRepository;
    private final ThrowHistoryRepository historyRepository;

    private static final String ALPHANUMERIC = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    @Transactional
    public GameSession createSession(CreateSessionRequest request) {
        String sessionCode = generateUniqueSessionCode();

        GameSession session = new GameSession();
        session.setSessionCode(sessionCode);
        session.setStartingScore(request.getStartingScore());
        session.setStatus(GameStatus.WAITING);
        session.setCurrentPlayerIndex(0);
        session.setDartsThrown(0);

        // Create players
        List<String> playerNames = request.getPlayerNames();
        for (int i = 0; i < playerNames.size(); i++) {
            Player player = new Player(playerNames.get(i), request.getStartingScore(), i);
            session.addPlayer(player);
        }

        log.info("Created session {} with {} players", sessionCode, playerNames.size());
        return sessionRepository.save(session);
    }

    @Transactional(readOnly = true)
    public GameSession getSession(String sessionCode) {
        return sessionRepository.findBySessionCode(sessionCode.toUpperCase())
            .orElseThrow(() -> new IllegalArgumentException("Session not found: " + sessionCode));
    }

    @Transactional
    public GameSession joinSession(String sessionCode) {
        GameSession session = getSession(sessionCode);

        if (session.getStatus() == GameStatus.FINISHED) {
            throw new IllegalStateException("Cannot join a finished game");
        }

        log.info("Device joined session {}", sessionCode);
        return session;
    }

    @Transactional
    public GameSession startGame(String sessionCode) {
        GameSession session = getSession(sessionCode);

        if (session.getStatus() != GameStatus.WAITING) {
            throw new IllegalStateException("Game already started or finished");
        }

        if (session.getPlayers().size() < 2) {
            throw new IllegalStateException("Need at least 2 players to start");
        }

        session.setStatus(GameStatus.ACTIVE);
        log.info("Game started for session {}", sessionCode);
        return sessionRepository.save(session);
    }

    @Transactional
    public GameStateDTO processThrow(String sessionCode, ThrowRequest request) {
        GameSession session = getSession(sessionCode);

        if (session.getStatus() != GameStatus.ACTIVE) {
            throw new IllegalStateException("Game is not active");
        }

        Player currentPlayer = session.getCurrentPlayer();
        if (currentPlayer == null) {
            throw new IllegalStateException("No current player");
        }

        // Store history for undo
        ThrowHistory history = new ThrowHistory(
            session.getCurrentPlayerIndex(),
            request.getPoints(),
            currentPlayer.getScore(),
            currentPlayer.getCurrentThrow(),
            session.getDartsThrown()
        );
        session.addThrowHistory(history);

        // Calculate new score
        int points = request.getPoints();
        int newScore = currentPlayer.getScore() - points;
        int newCurrentThrow = currentPlayer.getCurrentThrow() + points;

        // Check for bust (score < 0 or score == 1)
        if (newScore < 0 || newScore == 1) {
            // Bust! Revert the entire turn
            return handleBust(session, currentPlayer);
        }

        // Update player score
        currentPlayer.setScore(newScore);
        currentPlayer.setCurrentThrow(newCurrentThrow);

        // Check for win
        if (newScore == 0) {
            return handleWin(session, currentPlayer);
        }

        // Increment darts thrown
        session.setDartsThrown(session.getDartsThrown() + 1);

        // Auto-advance to next player after 3 darts
        if (session.getDartsThrown() >= 3) {
            advanceToNextPlayer(session);
        }

        sessionRepository.save(session);
        return GameStateDTO.from(session);
    }

    @Transactional
    public GameStateDTO undoLastThrow(String sessionCode) {
        GameSession session = getSession(sessionCode);

        if (session.getThrowHistory().isEmpty()) {
            throw new IllegalStateException("No throws to undo");
        }

        // Get the most recent throw
        ThrowHistory lastThrow = session.getThrowHistory().get(0);

        // Restore player state
        Player player = session.getPlayers().get(lastThrow.getPlayerIndex());
        player.setScore(lastThrow.getPreviousScore());
        player.setCurrentThrow(lastThrow.getPreviousCurrentThrow());

        // Restore game state
        session.setCurrentPlayerIndex(lastThrow.getPlayerIndex());
        session.setDartsThrown(lastThrow.getPreviousDartsThrown());

        // If game was finished, reactivate it
        if (session.getStatus() == GameStatus.FINISHED) {
            session.setStatus(GameStatus.ACTIVE);
            session.setWinnerName(null);
        }

        // Remove the history entry
        session.getThrowHistory().remove(0);
        historyRepository.delete(lastThrow);

        sessionRepository.save(session);
        log.info("Undid last throw in session {}", sessionCode);
        return GameStateDTO.from(session, "Undo successful");
    }

    @Transactional
    public GameStateDTO nextPlayer(String sessionCode) {
        GameSession session = getSession(sessionCode);

        if (session.getStatus() != GameStatus.ACTIVE) {
            throw new IllegalStateException("Game is not active");
        }

        advanceToNextPlayer(session);
        sessionRepository.save(session);

        return GameStateDTO.from(session);
    }

    @Transactional
    public void deleteSession(String sessionCode) {
        GameSession session = getSession(sessionCode);
        sessionRepository.delete(session);
        log.info("Deleted session {}", sessionCode);
    }

    @Transactional
    public GameStateDTO resetGame(String sessionCode) {
        GameSession session = getSession(sessionCode);

        // Reset all players
        for (Player player : session.getPlayers()) {
            player.setScore(session.getStartingScore());
            player.setCurrentThrow(0);
        }

        // Reset game state
        session.setCurrentPlayerIndex(0);
        session.setDartsThrown(0);
        session.setStatus(GameStatus.ACTIVE);
        session.setWinnerName(null);

        // Clear history
        session.getThrowHistory().clear();

        sessionRepository.save(session);
        log.info("Reset game for session {}", sessionCode);
        return GameStateDTO.from(session, "Game reset");
    }

    private GameStateDTO handleBust(GameSession session, Player currentPlayer) {
        // Revert score to what it was at the start of the turn
        int pointsThisTurn = currentPlayer.getCurrentThrow();
        currentPlayer.setScore(currentPlayer.getScore() + pointsThisTurn);
        currentPlayer.setCurrentThrow(0);

        // Move to next player
        advanceToNextPlayer(session);

        sessionRepository.save(session);
        log.info("Bust for player {} in session {}", currentPlayer.getName(), session.getSessionCode());
        return GameStateDTO.from(session, "BUST! Turn reverted.");
    }

    private GameStateDTO handleWin(GameSession session, Player winner) {
        session.setStatus(GameStatus.FINISHED);
        session.setWinnerName(winner.getName());

        sessionRepository.save(session);
        log.info("Player {} won session {}", winner.getName(), session.getSessionCode());
        return GameStateDTO.from(session, winner.getName() + " wins!");
    }

    private void advanceToNextPlayer(GameSession session) {
        // Reset current player's turn score
        Player currentPlayer = session.getCurrentPlayer();
        if (currentPlayer != null) {
            currentPlayer.setCurrentThrow(0);
        }

        // Move to next player
        int nextIndex = (session.getCurrentPlayerIndex() + 1) % session.getPlayers().size();
        session.setCurrentPlayerIndex(nextIndex);
        session.setDartsThrown(0);
    }

    private String generateUniqueSessionCode() {
        String code;
        int attempts = 0;
        do {
            code = generateSessionCode();
            attempts++;
            if (attempts > 100) {
                throw new RuntimeException("Could not generate unique session code");
            }
        } while (sessionRepository.existsBySessionCode(code));
        return code;
    }

    private String generateSessionCode() {
        StringBuilder sb = new StringBuilder(6);
        for (int i = 0; i < 6; i++) {
            sb.append(ALPHANUMERIC.charAt(RANDOM.nextInt(ALPHANUMERIC.length())));
        }
        return sb.toString();
    }
}
