package com.dartcounter.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "game_results")
@Getter
@Setter
@NoArgsConstructor
public class GameResult {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String sessionCode;

    @Column(nullable = false)
    private LocalDateTime playedAt;

    @Column(nullable = false)
    private Integer startingScore;

    @Column(nullable = false)
    private String outMode;  // 'double' or 'triple'

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "winner_id")
    private User winner;

    @OneToMany(mappedBy = "gameResult", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<GameParticipant> participants = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        playedAt = LocalDateTime.now();
    }

    public GameResult(String sessionCode, Integer startingScore, String outMode) {
        this.sessionCode = sessionCode;
        this.startingScore = startingScore;
        this.outMode = outMode;
    }

    public void addParticipant(GameParticipant participant) {
        participants.add(participant);
        participant.setGameResult(this);
    }
}
