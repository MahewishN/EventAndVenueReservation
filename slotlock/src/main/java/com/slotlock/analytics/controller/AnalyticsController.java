package com.slotlock.analytics.controller;


import com.slotlock.analytics.dto.AnalyticsOverviewResponse;
import com.slotlock.analytics.dto.PeakBookingTimeResponse;
import com.slotlock.analytics.dto.ResourceBookingStatsResponse;
import com.slotlock.analytics.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/analytics")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")

public class AnalyticsController {
    private final AnalyticsService analyticsService;

    @GetMapping("/overview")
    public ResponseEntity<AnalyticsOverviewResponse> getOverview()
    {
        return ResponseEntity.ok(analyticsService.getOverview());
    }

    @GetMapping("/resources")
    public ResponseEntity<List<ResourceBookingStatsResponse>> getResourceStats()
    {
        return ResponseEntity.ok(analyticsService.getResourcesStats());
    }

    @GetMapping("/peak-time")
    public ResponseEntity<List<PeakBookingTimeResponse>> getPeakBookingTimes()
    {
        return ResponseEntity.ok(analyticsService.getPeakBookingTimes());
    }
}
