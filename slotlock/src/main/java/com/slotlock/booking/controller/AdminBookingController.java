package com.slotlock.booking.controller;


import com.slotlock.booking.dto.BookingResponse;
import com.slotlock.booking.entity.BookingStatus;
import com.slotlock.booking.service.BookingService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/admin/bookings")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")

public class AdminBookingController {
    private final BookingService bookingService;

    @GetMapping
    public ResponseEntity<List<BookingResponse>> getAllBookings(
            @RequestParam(required = false) BookingStatus status,
            @RequestParam(required = false) Long resourceId,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate date)
    {
        return ResponseEntity.ok(bookingService.getAllBookings(status, resourceId, date));
    }

    @GetMapping("/{bookingId}")
    public ResponseEntity<BookingResponse> getBookingById(
            @PathVariable Long bookingId)
    {
        return ResponseEntity.ok(bookingService.getBookingById(bookingId));
    }

    @DeleteMapping("/{bookingId}")
    public ResponseEntity<String> cancelBooking(@PathVariable Long bookingId)
    {
        bookingService.cancelBookingAsAdmin(bookingId);
        return ResponseEntity.ok("Booking cancelled successfully");
    }
}
