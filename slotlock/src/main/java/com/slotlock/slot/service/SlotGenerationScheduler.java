package com.slotlock.slot.service;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.ZoneId;

@Component
@RequiredArgsConstructor
public class SlotGenerationScheduler {

    private final SlotService slotService;

    private static final int DAYS_AHEAD = 90;
    private static final ZoneId INDIA_ZONE = ZoneId.of("Asia/Kolkata");

    @EventListener(ApplicationReadyEvent.class)
    public void generateSlotsOnStartup() {
        generateFutureSlots();
    }

    @Scheduled(cron = "0 0 0 * * *", zone = "Asia/Kolkata")
    public void generateSlotsDaily() {
        generateFutureSlots();
    }

    private void generateFutureSlots() {

        LocalDate today = LocalDate.now(INDIA_ZONE);

        for (int i = 0; i <= DAYS_AHEAD; i++) {
            slotService.generateSlotsForDate(
                    today.plusDays(i)
            );
        }
    }
}