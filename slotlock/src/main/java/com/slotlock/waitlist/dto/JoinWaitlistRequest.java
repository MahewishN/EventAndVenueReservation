package com.slotlock.waitlist.dto;


import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter

public class JoinWaitlistRequest {
    @NotNull(message = "Slot Id is required")
    private long slotId;
}
