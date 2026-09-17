package com.slotlock.slot.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SlotStatusRequest {
    @NotNull(message = "Blocked status is required")
    private Boolean blocked;
}
