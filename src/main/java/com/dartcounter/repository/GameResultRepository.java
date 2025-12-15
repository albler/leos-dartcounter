package com.dartcounter.repository;

import com.dartcounter.entity.GameResult;
import com.dartcounter.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface GameResultRepository extends JpaRepository<GameResult, UUID> {

    List<GameResult> findByWinnerOrderByPlayedAtDesc(User winner);

    @Query("SELECT gr FROM GameResult gr JOIN gr.participants p WHERE p.user = :user ORDER BY gr.playedAt DESC")
    List<GameResult> findByParticipantUser(@Param("user") User user);

    @Query("SELECT COUNT(gr) FROM GameResult gr WHERE gr.winner = :user")
    long countWinsByUser(@Param("user") User user);

    @Query("SELECT COUNT(DISTINCT gr) FROM GameResult gr JOIN gr.participants p WHERE p.user = :user")
    long countGamesPlayedByUser(@Param("user") User user);
}
