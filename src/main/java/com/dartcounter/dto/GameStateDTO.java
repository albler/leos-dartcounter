package com.dartcounter.dto;

import com.dartcounter.entity.GameSession;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GameStateDTO {

    private String sessionCode;
    private List<PlayerDTO> players;
    private Integer currentPlayerIndex;
    private Integer dartsThrown;
    private Integer startingScore;
    private String status;
    private String winnerName;
    private Long version;
    private String message;

    public static GameStateDTO from(GameSession session) {
        return GameStateDTO.builder()
            .sessionCode(session.getSessionCode())
            .players(session.getPlayers().stream()
                .map(PlayerDTO::from)
                .toList())
            .currentPlayerIndex(session.getCurrentPlayerIndex())
            .dartsThrown(session.getDartsThrown())
            .startingScore(session.getStartingScore())
            .status(session.getStatus().name())
            .winnerName(session.getWinnerName())
            .version(session.getVersion())
            .build();
    }

    public static GameStateDTO from(GameSession session, String message) {
        GameStateDTO dto = from(session);
        dto.setMessage(message);
        return dto;
    }
}
