package com.dartcounter.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "game_sessions")
@Getter
@Setter
@NoArgsConstructor
public class GameSession {

    @Id
    @Column(length = 6)
    private String sessionCode;

    @Column(nullable = false)
    private Integer startingScore = 301;

    @Column(nullable = false)
    private Integer currentPlayerIndex = 0;

    @Column(nullable = false)
    private Integer dartsThrown = 0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private GameStatus status = GameStatus.WAITING;

    private String winnerName;

    @Version
    private Long version = 0L;

    @OneToMany(mappedBy = "session", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @OrderBy("playerOrder ASC")
    private List<Player> players = new ArrayList<>();

    @OneToMany(mappedBy = "session", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @OrderBy("id DESC")
    private List<ThrowHistory> throwHistory = new ArrayList<>();

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public void addPlayer(Player player) {
        players.add(player);
        player.setSession(this);
    }

    public void addThrowHistory(ThrowHistory history) {
        throwHistory.add(0, history); // Add to beginning for DESC order
        history.setSession(this);
    }

    public Player getCurrentPlayer() {
        if (players.isEmpty() || currentPlayerIndex >= players.size()) {
            return null;
        }
        return players.get(currentPlayerIndex);
    }
}
