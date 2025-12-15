package com.dartcounter.dto;

import com.dartcounter.entity.User;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserDTO {

    private UUID id;
    private String email;
    private String name;
    private String pictureUrl;
    private LocalDateTime createdAt;
    private LocalDateTime lastLoginAt;

    public static UserDTO from(User user) {
        return new UserDTO(
            user.getId(),
            user.getEmail(),
            user.getName(),
            user.getPictureUrl(),
            user.getCreatedAt(),
            user.getLastLoginAt()
        );
    }
}
