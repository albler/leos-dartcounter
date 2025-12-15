package com.dartcounter.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "throw_history")
@Getter
@Setter
@NoArgsConstructor
public class ThrowHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Integer playerIndex;

    @Column(nullable = false)
    private Integer points;

    @Column(nullable = false)
    private Integer previousScore;

    @Column(nullable = false)
    private Integer previousCurrentThrow;

    @Column(nullable = false)
    private Integer previousDartsThrown;

    @Column(nullable = false)
    private LocalDateTime thrownAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_code", nullable = false)
    private GameSession session;

    public ThrowHistory(Integer playerIndex, Integer points, Integer previousScore,
                        Integer previousCurrentThrow, Integer previousDartsThrown) {
        this.playerIndex = playerIndex;
        this.points = points;
        this.previousScore = previousScore;
        this.previousCurrentThrow = previousCurrentThrow;
        this.previousDartsThrown = previousDartsThrown;
        this.thrownAt = LocalDateTime.now();
    }
}
