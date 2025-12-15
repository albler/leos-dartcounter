package com.dartcounter.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserStatsDTO {

    private long gamesPlayed;
    private long gamesWon;
    private double winRate;
    private BigDecimal averagePerTurn;
    private Integer highestCheckout;
    private long total180s;
    private long total140Plus;
    private long total100Plus;
    private long totalDartsThrown;
}
