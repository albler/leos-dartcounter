package com.dartcounter.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "game_participants")
@Getter
@Setter
@NoArgsConstructor
public class GameParticipant {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "game_result_id", nullable = false)
    private GameResult gameResult;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;  // Null if guest player

    @Column(nullable = false)
    private String playerName;  // Display name used in game

    @Column(nullable = false)
    private Integer position;  // 1st, 2nd, 3rd, etc.

    @Column(nullable = false)
    private Integer totalDarts;

    @Column(precision = 5, scale = 2)
    private BigDecimal avgPerTurn;

    @Column
    private Integer highestCheckout;

    @Column(nullable = false)
    private Integer num180s = 0;

    @Column(nullable = false)
    private Integer num140Plus = 0;

    @Column(nullable = false)
    private Integer num100Plus = 0;

    public GameParticipant(User user, String playerName, Integer position, Integer totalDarts) {
        this.user = user;
        this.playerName = playerName;
        this.position = position;
        this.totalDarts = totalDarts;
    }

    public boolean isWinner() {
        return position == 1;
    }
}
