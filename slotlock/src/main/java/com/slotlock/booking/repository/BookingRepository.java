package com.slotlock.booking.repository;

import com.slotlock.analytics.dto.PeakBookingTimeResponse;
import com.slotlock.analytics.dto.ResourceBookingStatsResponse;
import com.slotlock.booking.entity.Booking;
import com.slotlock.booking.entity.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface BookingRepository extends JpaRepository<Booking, Long> {

    List<Booking> findByUserIdOrderByBookedAtDesc(Long userId);

    boolean existsBySlotIdAndStatusIn(Long slotId, List<Booking> statuses);

    List<Booking> findByStatusAndExpiresAtBefore(BookingStatus status,
                                                 java.time.LocalDateTime time);

    @Query("""
            SELECT b
            FROM Booking b
            JOIN FETCH b.slot s
            JOIN FETCH s.resource r
            JOIN FETCH b.user u
            WHERE (:status IS NULL OR b.status = :status)
              AND (:resourceId IS NULL OR r.id = :resourceId)
              AND (:date IS NULL OR s.date = :date)
            ORDER BY b.bookedAt DESC
            """)
    List<Booking> findAdminBookings(
            @Param("status") BookingStatus status,
            @Param("resourceId") Long resourceId,
            @Param("date") LocalDate date
    );

    long countByStatus(BookingStatus status);

    @Query("""
        SELECT new com.slotlock.analytics.dto.ResourceBookingStatsResponse(
            r.id,
            r.name,
            COUNT(b.id),
            SUM(CASE WHEN b.status = :status THEN 1L ELSE 0L END),
            0L,
            0.0
        )
        FROM Booking b
        JOIN b.slot s
        JOIN s.resource r
        GROUP BY r.id, r.name
        ORDER BY COUNT(b.id) DESC
        """)

    List<ResourceBookingStatsResponse> findBookingStatsByResource(
            @org.springframework.data.repository.query.Param("status")
            BookingStatus status
    );

    @Query("""
        SELECT new com.slotlock.analytics.dto.PeakBookingTimeResponse(
            s.startTime,
            COUNT(b.id)
        )
        FROM Booking b
        JOIN b.slot s
        WHERE b.status = :status
        GROUP BY s.startTime
        ORDER BY COUNT(b.id) DESC
        """)
    List<PeakBookingTimeResponse> findPeakBookingTimes(
            @org.springframework.data.repository.query.Param("status")
            BookingStatus status
    );

    @Query("""
        SELECT COUNT(b.id)
        FROM Booking b
        JOIN b.slot s
        WHERE s.resource.id = :resourceId
          AND b.status = :status
        """)
    long countBookingsByResourceAndStatus(
            @org.springframework.data.repository.query.Param("resourceId")
            Long resourceId,
            @org.springframework.data.repository.query.Param("status")
            BookingStatus status
    );
}
