package com.slotlock.slot.dto;

import com.slotlock.slot.entity.SlotStatus;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalTime;

@Getter
@AllArgsConstructor
public class SlotResponse {
    private Long id;
    private Long resourceId;
    private String resourceName;
    private LocalDate date;
    private LocalTime startTime;
    private LocalTime endTime;
    private SlotStatus status;
}
