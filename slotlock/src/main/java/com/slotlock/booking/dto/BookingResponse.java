package com.slotlock.booking.dto;

import com.slotlock.booking.entity.BookingStatus;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Getter
@AllArgsConstructor
public class BookingResponse {
    private Long id;
    private Long slotId;
    private Long resourceId;
    private String resourceName;
    private Long userId;
    private LocalDate date;
    private LocalTime startTime;
    private LocalTime endTime;
    private BookingStatus status;
    private LocalDateTime bookedAt;
    private LocalDateTime expiresAt;
}
