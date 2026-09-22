package com.slotlock.booking.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateBookingRequest {
    @NotNull(message = "Slot ID is required")
    private Long slotId;
}
