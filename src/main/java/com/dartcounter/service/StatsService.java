package com.dartcounter.service;

import com.dartcounter.dto.UserStatsDTO;
import com.dartcounter.entity.User;
import com.dartcounter.repository.GameParticipantRepository;
import com.dartcounter.repository.GameResultRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class StatsService {

    private final GameResultRepository gameResultRepository;
    private final GameParticipantRepository gameParticipantRepository;

    public UserStatsDTO getUserStats(User user) {
        long gamesPlayed = gameResultRepository.countGamesPlayedByUser(user);
        long gamesWon = gameResultRepository.countWinsByUser(user);

        double winRate = gamesPlayed > 0 ? (double) gamesWon / gamesPlayed * 100 : 0;

        BigDecimal avgPerTurn = gameParticipantRepository.calculateAveragePerTurn(user);
        Integer highestCheckout = gameParticipantRepository.findHighestCheckout(user);

        Long total180s = gameParticipantRepository.countTotal180s(user);
        Long total140Plus = gameParticipantRepository.countTotal140Plus(user);
        Long total100Plus = gameParticipantRepository.countTotal100Plus(user);
        Long totalDarts = gameParticipantRepository.countTotalDarts(user);

        return UserStatsDTO.builder()
            .gamesPlayed(gamesPlayed)
            .gamesWon(gamesWon)
            .winRate(Math.round(winRate * 10) / 10.0)  // Round to 1 decimal
            .averagePerTurn(avgPerTurn)
            .highestCheckout(highestCheckout)
            .total180s(total180s != null ? total180s : 0)
            .total140Plus(total140Plus != null ? total140Plus : 0)
            .total100Plus(total100Plus != null ? total100Plus : 0)
            .totalDartsThrown(totalDarts != null ? totalDarts : 0)
            .build();
    }
}
