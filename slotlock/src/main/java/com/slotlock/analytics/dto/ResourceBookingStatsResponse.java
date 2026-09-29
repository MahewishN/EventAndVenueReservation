package com.slotlock.analytics.dto;


import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class ResourceBookingStatsResponse {
    private long resourceId;
    private String resourceName;
    private long totalBookings;
    private long confirmedBookings;
    private long totalSlots;
    private double utilizationPercentage;
}
