package com.slotlock.waitlist.service;

import com.slotlock.booking.dto.BookingResponse;
import com.slotlock.booking.entity.Booking;
import com.slotlock.booking.entity.BookingStatus;
import com.slotlock.booking.repository.BookingRepository;
import com.slotlock.exception.InvalidSlotOperationException;
import com.slotlock.exception.SlotNotFoundException;
import com.slotlock.exception.UserNotFoundException;
import com.slotlock.slot.entity.Slot;
import com.slotlock.slot.entity.SlotStatus;
import com.slotlock.slot.repository.SlotRepository;
import com.slotlock.user.entity.User;
import com.slotlock.user.repository.UserRepository;
import com.slotlock.waitlist.dto.JoinWaitlistRequest;
import com.slotlock.waitlist.dto.WaitlistPositionResponse;
import com.slotlock.waitlist.dto.WaitlistResponse;
import com.slotlock.waitlist.entity.WaitlistEntry;
import com.slotlock.waitlist.entity.WaitlistStatus;
import com.slotlock.waitlist.repository.WaitlistRepository;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class WaitlistService {
    private final WaitlistRepository waitlistRepository;
    private final SlotRepository slotRepository;
    private final UserRepository userRepository;
    private final BookingRepository bookingRepository;

    @Transactional
    public WaitlistResponse joinWaitlist(JoinWaitlistRequest request)
    {
        Slot slot = slotRepository.findById(request.getSlotId())
                .orElseThrow(()->new SlotNotFoundException("Slot not found with id: "+request.getSlotId()));

        if(slot.getStatus() != SlotStatus.BOOKED)
        {
            throw new InvalidSlotOperationException("Waitlist is available only for booked slots");
        }

        String email = getAuthenticatedUserEmail();

        User user = userRepository.findByEmail(email)
                .orElseThrow(()->new UserNotFoundException("User not found"));

        if(!user.getActive()){
            throw new InvalidSlotOperationException("Inactive users cannot join the waitlist");
        }

        if(waitlistRepository.existsBySlotIdAndUserIdAndStatus
                (slot.getId(), user.getId(), WaitlistStatus.WAITING))
        {
            throw new InvalidSlotOperationException("User is already on the waitlist for this slot");
        }

        WaitlistEntry entry = WaitlistEntry.builder()
                .slot(slot)
                .user(user)
                .joinedAt(LocalDateTime.now())
                .status(WaitlistStatus.WAITING)
                .build();

        WaitlistEntry savedEntry = waitlistRepository.save(entry);
        return mapToResponse(savedEntry);
    }

    @Transactional(readOnly = true)
    public WaitlistPositionResponse getPosition(Long entryId)
    {
        WaitlistEntry entry = waitlistRepository.findById(entryId)
                .orElseThrow(()-> new InvalidSlotOperationException("Waitlist entry not found with id: "+entryId));

        String email = getAuthenticatedUserEmail();

        if(!entry.getUser().getEmail().equals(email)){
            throw new InvalidSlotOperationException("You can only view your own waitlist position");
        }

        if(entry.getStatus() != WaitlistStatus.WAITING){
            throw new InvalidSlotOperationException("Waitlist position is available only for waiting entries");
        }

        List<WaitlistEntry> waitingEntries = waitlistRepository
                .findBySlotIdAndStatusOrderByJoinedAtAsc(entry.getSlot().getId(),
                                                    WaitlistStatus.WAITING);

        int position = 0;
        for(int i=0; i < waitingEntries.size(); i++)
        {
            if(waitingEntries.get(i).getId().equals(entry.getId()))
            {
                position = i + 1;
                break;
            }
        }

        if(position == 0)
        {
            throw new InvalidSlotOperationException("Unable to determine waitlist position");
        }

        return new WaitlistPositionResponse(entry.getId(),
                entry.getSlot().getId(), position);
    }

    @Transactional(readOnly = true)
    public List<WaitlistResponse> getMyWaitlistEntries()
    {
        String email = getAuthenticatedUserEmail();
        User user = userRepository.findByEmail(email)
                .orElseThrow(()-> new UserNotFoundException("User not found"));

        return waitlistRepository
                .findByUserIdOrderByJoinedAtDesc(user.getId())
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional
    public BookingResponse confirmWaitlistOffer(Long entryId)
    {
        WaitlistEntry entry = waitlistRepository.findById(entryId)
                .orElseThrow(()-> new InvalidSlotOperationException
                        ("Waitlist entry not found with id: "+entryId));

        String email = getAuthenticatedUserEmail();
        if(!entry.getUser().getEmail().equals(email))
        {
            throw new InvalidSlotOperationException("You can only confirm your own waitlist offer");
        }

        if(entry.getStatus() != WaitlistStatus.OFFERED)
        {
            throw new InvalidSlotOperationException("Only offered waitlist entries can be confirmed");
        }
        LocalDateTime now = LocalDateTime.now();
        if(now.isAfter(entry.getExpiresAt()))
        {
            entry.setStatus(WaitlistStatus.EXPIRED);
            waitlistRepository.save(entry);

            throw new InvalidSlotOperationException("Waitlist offer has expired");
        }

        Slot slot = entry.getSlot();
        if(slot.getStatus() != SlotStatus.AVAILABLE)
        {
            throw new InvalidSlotOperationException("Slot is not longer available");
        }

        slot.setStatus(SlotStatus.BOOKED);
        Slot savedSlot = slotRepository.saveAndFlush(slot);

        Booking booking = Booking.builder()
                .slot(savedSlot)
                .user(entry.getUser())
                .status(BookingStatus.CONFIRMED)
                .bookedAt(now)
                .expiresAt(now)
                .build();

        Booking savedBooking = bookingRepository.save(booking);
        entry.setStatus(WaitlistStatus.CONVERTED);
        waitlistRepository.save(entry);
        return mapToBookingResponse(savedBooking);
    }

    private String getAuthenticatedUserEmail()
    {
        Authentication authentication = SecurityContextHolder.getContext()
                .getAuthentication();

        if(authentication == null || !authentication.isAuthenticated())
        {
            throw new InvalidSlotOperationException("User is not authenticated");
        }
        return authentication.getName();
    }

    private WaitlistResponse mapToResponse(WaitlistEntry entry)
    {
        return new WaitlistResponse(
                entry.getId(),
                entry.getSlot().getId(),
                entry.getSlot().getResource().getId(),
                entry.getSlot().getResource().getName(),
                entry.getUser().getId(),
                entry.getJoinedAt(),
                entry.getStatus(),
                entry.getOfferedAt(),
                entry.getExpiresAt()
                );
    }

    private BookingResponse mapToBookingResponse(Booking booking) {

        Slot slot = booking.getSlot();

        return new BookingResponse(
                booking.getId(),
                slot.getId(),
                slot.getResource().getId(),
                slot.getResource().getName(),
                booking.getUser().getId(),
                slot.getDate(),
                slot.getStartTime(),
                slot.getEndTime(),
                booking.getStatus(),
                booking.getBookedAt(),
                booking.getExpiresAt()
        );
    }
}
