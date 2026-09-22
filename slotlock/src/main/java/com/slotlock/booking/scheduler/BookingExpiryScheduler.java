package com.slotlock.booking.scheduler;

import com.slotlock.booking.entity.Booking;
import com.slotlock.booking.entity.BookingStatus;
import com.slotlock.booking.repository.BookingRepository;
import com.slotlock.slot.entity.Slot;
import com.slotlock.slot.entity.SlotStatus;
import com.slotlock.slot.repository.SlotRepository;
import com.slotlock.waitlist.entity.WaitlistEntry;
import com.slotlock.waitlist.entity.WaitlistStatus;
import com.slotlock.waitlist.repository.WaitlistRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
public class BookingExpiryScheduler {
    private final BookingRepository bookingRepository;
    private final SlotRepository slotRepository;
    private final WaitlistRepository waitlistRepository;

    private static final long WAITLIST_OFFER_WINDOW_MINUTES = 2;

    @Scheduled(fixedRate = 60000)
    @Transactional
    public void expirePendingBookings()
    {
        LocalDateTime now = LocalDateTime.now();
        List<Booking> expiredBookings = bookingRepository.findByStatusAndExpiresAtBefore(BookingStatus.PENDING, now);

        for(Booking booking: expiredBookings)
        {
            booking.setStatus(BookingStatus.EXPIRED);
            Slot slot = booking.getSlot();
            if(slot.getStatus() == SlotStatus.BOOKED)
            {
                slot.setStatus(SlotStatus.AVAILABLE);
                slotRepository.save(slot);

                promoteNextWaitlistEntry(slot);
            }
            bookingRepository.save(booking);
        }
        expireWaitlistOffers(now);
    }

    private void promoteNextWaitlistEntry(Slot slot)
    {
        List<WaitlistEntry> waitingEntries = waitlistRepository
                .findBySlotIdAndStatusOrderByJoinedAtAsc(slot.getId(),
                        WaitlistStatus.WAITING);

        if(waitingEntries.isEmpty())
        {
            return ;
        }

        WaitlistEntry entry = waitingEntries.get(0);

        LocalDateTime offeredAt = LocalDateTime.now();
        LocalDateTime expiresAt = offeredAt.plusMinutes(WAITLIST_OFFER_WINDOW_MINUTES);

        entry.setStatus(WaitlistStatus.OFFERED);
        entry.setOfferedAt(offeredAt);
        entry.setExpiresAt(expiresAt);

        waitlistRepository.save(entry);
    }

    private void expireWaitlistOffers(LocalDateTime now)
    {
        List<WaitlistEntry> offeredEntries = waitlistRepository
                .findByStatusAndExpiresAtBefore(WaitlistStatus.OFFERED, now);

        for(WaitlistEntry entry : offeredEntries)
        {
            entry.setStatus(WaitlistStatus.EXPIRED);
            waitlistRepository.save(entry);

            Slot slot = entry.getSlot();

            if(slot.getStatus() == SlotStatus.AVAILABLE)
            {
                promoteNextWaitlistEntry(slot);
            }
        }
    }
}
