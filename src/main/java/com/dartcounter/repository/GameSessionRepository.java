package com.dartcounter.repository;

import com.dartcounter.entity.GameSession;
import com.dartcounter.entity.GameStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface GameSessionRepository extends JpaRepository<GameSession, String> {

    Optional<GameSession> findBySessionCode(String sessionCode);

    List<GameSession> findByStatus(GameStatus status);

    List<GameSession> findByUpdatedAtBefore(LocalDateTime dateTime);

    boolean existsBySessionCode(String sessionCode);
}
