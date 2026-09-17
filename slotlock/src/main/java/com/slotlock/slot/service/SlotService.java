package com.slotlock.slot.service;

import com.slotlock.exception.InvalidSlotOperationException;
import com.slotlock.exception.ResourceNotFoundException;
import com.slotlock.exception.SlotNotFoundException;
import com.slotlock.resource.entity.Resource;
import com.slotlock.resource.repository.ResourceRepository;
import com.slotlock.slot.dto.SlotResponse;
import com.slotlock.slot.dto.SlotStatusRequest;
import com.slotlock.slot.entity.Slot;
import com.slotlock.slot.entity.SlotStatus;
import com.slotlock.slot.repository.SlotRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SlotService {

    private final SlotRepository slotRepository;
    private final ResourceRepository resourceRepository;

    @Transactional
    public void generateSlotsForDate(LocalDate date) {

        List<Resource> resources = resourceRepository.findAll();

        for (Resource resource : resources) {

            if (!resource.getActive()) {
                continue;
            }

            generateSlotsForResource(resource, date);
        }
    }

    private void generateSlotsForResource(Resource resource, LocalDate date)
    {
        LocalTime startTime = resource.getOpenTime();
        LocalTime closeTime = resource.getCloseTime();

        int duration = resource.getSlotDuration();

        List<Slot> slotsToSave = new ArrayList<>();

        while (true) {

            LocalTime endTime = startTime.plusMinutes(duration);

            /*
             * LocalTime wraps around midnight.
             *
             * Example:
             * 22:00 + 180 minutes = 01:00
             *
             * In that case endTime becomes earlier than startTime,
             * so we must stop generating slots.
             */
            if (endTime.isBefore(startTime)) {
                break;
            }

            /*
             * Do not create a slot that goes beyond the resource's
             * closing time.
             *
             * Example:
             * closeTime = 23:00
             * startTime = 22:00
             * duration = 180
             * endTime = 01:00
             *
             * The previous check already handles this midnight case.
             */
            if (endTime.isAfter(closeTime)) {
                break;
            }

            boolean alreadyExists =
                    slotRepository.existsByResourceIdAndDateAndStartTime(
                            resource.getId(),
                            date,
                            startTime
                    );

            if (!alreadyExists) {

                Slot slot = Slot.builder()
                        .resource(resource)
                        .date(date)
                        .startTime(startTime)
                        .endTime(endTime)
                        .status(SlotStatus.AVAILABLE)
                        .build();

                slotsToSave.add(slot);
            }

            startTime = endTime;
        }

        if (!slotsToSave.isEmpty()) {
            slotRepository.saveAll(slotsToSave);
        }
    }

    @Transactional(readOnly = true)
    public List<SlotResponse> getSlotsByResourceAndDate(
            Long resourceId,
            LocalDate date) {

        if (!resourceRepository.existsById(resourceId)) {
            throw new ResourceNotFoundException(
                    "Resource not found with id: " + resourceId);
        }

        return slotRepository
                .findByResourceIdAndDateOrderByStartTime(resourceId, date)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional
    public SlotResponse updateSlotStatus(Long slotId,
            SlotStatusRequest request) {

        Slot slot = findSlotById(slotId);

        if (slot.getStatus() == SlotStatus.BOOKED) {
            throw new InvalidSlotOperationException(
                    "A booked slot cannot be blocked or unblocked");
        }

        if (request.getBlocked()) {
            slot.setStatus(SlotStatus.BLOCKED);
        } else {
            slot.setStatus(SlotStatus.AVAILABLE);
        }

        Slot updatedSlot = slotRepository.save(slot);

        return mapToResponse(updatedSlot);
    }

    @Transactional(readOnly = true)
    public SlotResponse getSlotById(Long slotId) {

        Slot slot = findSlotById(slotId);

        return mapToResponse(slot);
    }

    private Slot findSlotById(Long slotId) {

        return slotRepository
                .findById(slotId)
                .orElseThrow(() -> new SlotNotFoundException("Slot not found with id: " + slotId));
    }

    private SlotResponse mapToResponse(Slot slot) {

        return new SlotResponse(
                slot.getId(),
                slot.getResource().getId(),
                slot.getResource().getName(),
                slot.getDate(),
                slot.getStartTime(),
                slot.getEndTime(),
                slot.getStatus()
        );
    }
}