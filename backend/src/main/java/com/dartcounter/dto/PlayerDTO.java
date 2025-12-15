package com.dartcounter.dto;

import com.dartcounter.entity.Player;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PlayerDTO {

    private String name;
    private Integer score;
    private Integer currentThrow;
    private Integer playerOrder;

    public static PlayerDTO from(Player player) {
        return new PlayerDTO(
            player.getName(),
            player.getScore(),
            player.getCurrentThrow(),
            player.getPlayerOrder()
        );
    }
}
