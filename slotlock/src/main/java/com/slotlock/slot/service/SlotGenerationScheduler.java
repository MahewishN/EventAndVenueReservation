package com.slotlock.slot.service;

import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
@RequiredArgsConstructor
public class SlotGenerationScheduler {
    private final SlotService slotService;

    @Scheduled(cron = "0 0 0 * * *")
    public void generateDailySlots()
    {
        slotService.generateSlotsForDate(LocalDate.now());
    }
}
