package com.dartcounter.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "players")
@Getter
@Setter
@NoArgsConstructor
public class Player {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private Integer score;

    @Column(nullable = false)
    private Integer currentThrow = 0;

    @Column(nullable = false)
    private Integer playerOrder;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_code", nullable = false)
    private GameSession session;

    public Player(String name, Integer score, Integer playerOrder) {
        this.name = name;
        this.score = score;
        this.currentThrow = 0;
        this.playerOrder = playerOrder;
    }
}
