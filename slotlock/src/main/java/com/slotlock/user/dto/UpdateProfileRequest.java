package com.slotlock.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateProfileRequest {

    @NotBlank(message = "Username is required")
    @Size(min=3, max=50, message = "Username must be between 3 and 50 characters")
    private String username;
}
