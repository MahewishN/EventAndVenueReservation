package com.slotlock.booking.service;


import com.slotlock.booking.dto.BookingResponse;
import com.slotlock.booking.dto.CreateBookingRequest;
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
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class BookingTransactionService {

    private final BookingRepository bookingRepository;
    private final SlotRepository slotRepository;
    private final UserRepository userRepository;

    private static final long CONFIRMATION_WINDOW_MINUTES = 10;

    @Transactional
    public BookingResponse createBookingTransaction(CreateBookingRequest request, String email)
    {
        Slot slot = slotRepository.findById(request.getSlotId())
                .orElseThrow(()-> new SlotNotFoundException
                        ("Slot not found with id: "+request.getSlotId()));

        if(slot.getStatus() != SlotStatus.AVAILABLE)
        {
            throw new InvalidSlotOperationException("Slot is not available for booking");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(()-> new UserNotFoundException("User not found"));

        if(!user.getActive())
        {
            throw new InvalidSlotOperationException("Inactive users cannot create bookings");
        }

        /*
         * The Slot is the resource being competed for.
         *
         * @Version on Slot ensures that if another transaction
         * modifies this same slot first, Hibernate detects the
         * version conflict.
         */
        slot.setStatus(SlotStatus.BOOKED);
        Slot savedSlot = slotRepository.saveAndFlush(slot);

        LocalDateTime bookedAt = LocalDateTime.now();
        LocalDateTime expiresAt = bookedAt.plusMinutes(CONFIRMATION_WINDOW_MINUTES);

        Booking booking = Booking.builder()
                .slot(savedSlot)
                .user(user)
                .status(BookingStatus.PENDING)
                .bookedAt(bookedAt)
                .expiresAt(expiresAt)
                .build();

        Booking savedBooking = bookingRepository.save(booking);
        return mapToResponse(savedBooking);
    }

    @Transactional
    public BookingResponse createBookingPessimisticTransaction(CreateBookingRequest request, String email)
    {
        Slot slot = slotRepository.findByIdForUpdate(request.getSlotId())
                .orElseThrow(()-> new SlotNotFoundException
                        ("Slot not found with id: "+request.getSlotId()));

        if(slot.getStatus() != SlotStatus.AVAILABLE)
        {
            throw new InvalidSlotOperationException("Slot is not available for booking");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(()-> new UserNotFoundException("User not found"));

        if(!user.getActive())
        {
            throw new InvalidSlotOperationException("Inactive users cannot create booking");
        }

        slot.setStatus(SlotStatus.BOOKED);
        Slot savedSlot = slotRepository.saveAndFlush(slot);

        LocalDateTime bookedAt = LocalDateTime.now();
        LocalDateTime expiresAt = bookedAt.plusMinutes(CONFIRMATION_WINDOW_MINUTES);

        Booking booking = Booking.builder()
                .slot(savedSlot)
                .user(user)
                .status(BookingStatus.PENDING)
                .bookedAt(bookedAt)
                .expiresAt(expiresAt)
                .build();

        Booking savedBooking = bookingRepository.save(booking);
        return mapToResponse(savedBooking);
    }

    private BookingResponse mapToResponse(Booking booking)
    {
        Slot slot = booking.getSlot();
        return new BookingResponse(booking.getId(),
                slot.getId(),
                slot.getResource().getId(),
                slot.getResource().getName(),
                booking.getUser().getId(),
                slot.getDate(),
                slot.getStartTime(),
                slot.getEndTime(),
                booking.getStatus(),
                booking.getBookedAt(),
                booking.getExpiresAt());
    }
}
