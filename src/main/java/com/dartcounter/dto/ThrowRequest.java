package com.dartcounter.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ThrowRequest {

    @NotNull(message = "Points are required")
    @Min(value = 0, message = "Points cannot be negative")
    @Max(value = 60, message = "Maximum points per dart is 60")
    private Integer points;

    private Long expectedVersion;
}
