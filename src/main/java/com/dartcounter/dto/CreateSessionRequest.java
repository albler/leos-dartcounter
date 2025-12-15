package com.dartcounter.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class CreateSessionRequest {

    @NotEmpty(message = "At least one player is required")
    private List<String> playerNames;

    @NotNull(message = "Starting score is required")
    private Integer startingScore = 301;
}
