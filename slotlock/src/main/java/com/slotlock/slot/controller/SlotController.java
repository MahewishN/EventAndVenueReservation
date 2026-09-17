package com.slotlock.slot.controller;

import com.slotlock.slot.dto.GenerateSlotRequest;
import com.slotlock.slot.dto.SlotResponse;
import com.slotlock.slot.dto.SlotStatusRequest;
import com.slotlock.slot.service.SlotService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequiredArgsConstructor
public class SlotController {
    private final SlotService slotService;

    @GetMapping("/api/slots/{slotId}")
    public ResponseEntity<SlotResponse> getSlotById(@PathVariable Long slotId)
    {
        return ResponseEntity.ok(slotService.getSlotById(slotId));
    }

    @GetMapping("/api/resources/{resourceId}/slots")
    public ResponseEntity<List<SlotResponse>> getSlotByResourceAndDate(
            @PathVariable Long resourceId,
            @RequestParam LocalDate date)
    {
        return ResponseEntity.ok(slotService.getSlotsByResourceAndDate(resourceId, date));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/api/admin/slots/generate")
    public ResponseEntity<String> generateSlots(
            @Valid @RequestBody GenerateSlotRequest request)
    {
        slotService.generateSlotsForDate(request.getDate());

        return ResponseEntity.ok("Slots generated successfully");
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/api/slots/{slotId}/status")
    public ResponseEntity<SlotResponse> updateSlotStatus(
            @PathVariable Long slotId,
            @Valid @RequestBody SlotStatusRequest request)
    {
        return ResponseEntity.ok(slotService.updateSlotStatus(slotId, request));
    }
}
