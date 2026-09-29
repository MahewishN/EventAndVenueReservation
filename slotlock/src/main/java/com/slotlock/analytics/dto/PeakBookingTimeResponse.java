package com.slotlock.analytics.dto;


import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalTime;

@Getter
@AllArgsConstructor
public class PeakBookingTimeResponse {
    private LocalTime startTime;
    private long confirmedBookings;
}
