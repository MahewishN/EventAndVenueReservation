package com.slotlock.slot.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class GenerateSlotRequest {
    @NotNull(message = "Date is required")
    private LocalDate date;
}
