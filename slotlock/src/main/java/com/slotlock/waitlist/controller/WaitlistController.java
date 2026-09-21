package com.slotlock.waitlist.controller;

import com.slotlock.booking.dto.BookingResponse;
import com.slotlock.waitlist.dto.JoinWaitlistRequest;
import com.slotlock.waitlist.dto.WaitlistPositionResponse;
import com.slotlock.waitlist.dto.WaitlistResponse;
import com.slotlock.waitlist.service.WaitlistService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/waitlist")
@RequiredArgsConstructor
public class WaitlistController {

    private final WaitlistService waitlistService;

    @PostMapping
    public ResponseEntity<WaitlistResponse> joinWaitlist(
            @Valid @RequestBody JoinWaitlistRequest request)
    {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(waitlistService.joinWaitlist(request));
    }

    @GetMapping("/my")
    public ResponseEntity<List<WaitlistResponse>> getMyWaitListEntries()
    {
        return ResponseEntity.ok(waitlistService.getMyWaitlistEntries());
    }

    @GetMapping("/{entryId}/position")
    public ResponseEntity<WaitlistPositionResponse> getPosition(
            @PathVariable Long entryId)
    {
        return ResponseEntity.ok(waitlistService.getPosition(entryId));
    }

    @PostMapping("/{entryId}/confirm")
    public ResponseEntity<BookingResponse> confirmWaitlistOffer(
            @PathVariable Long entryId)
    {
        return ResponseEntity.ok(waitlistService.confirmWaitlistOffer(entryId));
    }

}
