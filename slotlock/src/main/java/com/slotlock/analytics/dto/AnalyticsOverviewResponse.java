package com.slotlock.analytics.dto;


import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class AnalyticsOverviewResponse {
    private long totalBookings;
    private long pendingBookings;
    private long confirmedBookings;
    private long cancelledBookings;
    private long expiredBookings;
    private long totalResources;
    private long activeResources;
    private long totalSlots;
}
