package com.dartcounter.repository;

import com.dartcounter.entity.GameParticipant;
import com.dartcounter.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Repository
public interface GameParticipantRepository extends JpaRepository<GameParticipant, UUID> {

    List<GameParticipant> findByUserOrderByGameResultPlayedAtDesc(User user);

    @Query("SELECT AVG(gp.avgPerTurn) FROM GameParticipant gp WHERE gp.user = :user AND gp.avgPerTurn IS NOT NULL")
    BigDecimal calculateAveragePerTurn(@Param("user") User user);

    @Query("SELECT MAX(gp.highestCheckout) FROM GameParticipant gp WHERE gp.user = :user")
    Integer findHighestCheckout(@Param("user") User user);

    @Query("SELECT SUM(gp.num180s) FROM GameParticipant gp WHERE gp.user = :user")
    Long countTotal180s(@Param("user") User user);

    @Query("SELECT SUM(gp.num140Plus) FROM GameParticipant gp WHERE gp.user = :user")
    Long countTotal140Plus(@Param("user") User user);

    @Query("SELECT SUM(gp.num100Plus) FROM GameParticipant gp WHERE gp.user = :user")
    Long countTotal100Plus(@Param("user") User user);

    @Query("SELECT SUM(gp.totalDarts) FROM GameParticipant gp WHERE gp.user = :user")
    Long countTotalDarts(@Param("user") User user);
}
