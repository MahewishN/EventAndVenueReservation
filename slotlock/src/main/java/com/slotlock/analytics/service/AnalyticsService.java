package com.slotlock.analytics.service;


import com.slotlock.analytics.dto.AnalyticsOverviewResponse;
import com.slotlock.analytics.dto.PeakBookingTimeResponse;
import com.slotlock.analytics.dto.ResourceBookingStatsResponse;
import com.slotlock.booking.entity.BookingStatus;
import com.slotlock.booking.repository.BookingRepository;
import com.slotlock.resource.entity.Resource;
import com.slotlock.resource.repository.ResourceRepository;
import com.slotlock.slot.repository.SlotRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AnalyticsService
{

    private final BookingRepository bookingRepository;
    private final ResourceRepository resourceRepository;
    private final SlotRepository slotRepository;

    public AnalyticsOverviewResponse getOverview()
    {
        long totalBookings = bookingRepository.count();
        long pendingBookings = bookingRepository.countByStatus(BookingStatus.PENDING);
        long confirmedBookings = bookingRepository.countByStatus(BookingStatus.CONFIRMED);
        long cancelledBookings = bookingRepository.countByStatus(BookingStatus.CANCELLED);
        long expiredBookings = bookingRepository.countByStatus(BookingStatus.EXPIRED);

        List<Resource> resources = resourceRepository.findAll();

        long totalResources = resources.size();
        long activeResources = resources.stream()
                .filter(Resource::getActive)
                .count();
        long totalSlots = slotRepository.count();

        return new AnalyticsOverviewResponse(
                totalBookings,
                pendingBookings,
                confirmedBookings,
                cancelledBookings,
                expiredBookings,
                totalResources,
                activeResources,
                totalSlots);
    }

    public List<ResourceBookingStatsResponse> getResourcesStats()
    {
        List<ResourceBookingStatsResponse> result = new ArrayList<>();

        List<Resource> resources = resourceRepository.findAll();

        for(Resource resource: resources)
        {
            long totalBookings = bookingRepository.countBookingsByResourceAndStatus
                    (resource.getId(), BookingStatus.PENDING)
                    + bookingRepository.countBookingsByResourceAndStatus
                            (resource.getId(), BookingStatus.CONFIRMED)
                    + bookingRepository.countBookingsByResourceAndStatus
                            (resource.getId(), BookingStatus.CANCELLED)
                    + bookingRepository.countBookingsByResourceAndStatus
                            (resource.getId(), BookingStatus.EXPIRED);

            long confirmedBookings = bookingRepository.countBookingsByResourceAndStatus
                    (resource.getId(), BookingStatus.CONFIRMED);

            long totalSlots = slotRepository.countByResourceId(resource.getId());

            double utilization = totalSlots == 0 ? 0.0
                    : (confirmedBookings * 100.0) / totalSlots;

            result.add(new ResourceBookingStatsResponse(
                    resource.getId(),
                    resource.getName(),
                    totalBookings,
                    confirmedBookings,
                    totalSlots,
                    Math.round(utilization * 100.0) / 100.0)
            );
        }
        return result;
    }

    public List<PeakBookingTimeResponse> getPeakBookingTimes()
    {
        return bookingRepository.findPeakBookingTimes(BookingStatus.CONFIRMED);
    }
}
