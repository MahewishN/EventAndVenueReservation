package com.slotlock.booking.service;

import com.slotlock.booking.dto.BookingResponse;
import com.slotlock.booking.dto.CreateBookingRequest;
import com.slotlock.booking.entity.Booking;
import com.slotlock.booking.entity.BookingStatus;
import com.slotlock.booking.repository.BookingRepository;
import com.slotlock.exception.ConcurrentBookingException;
import com.slotlock.exception.InvalidSlotOperationException;
import com.slotlock.exception.UserNotFoundException;
import com.slotlock.slot.entity.Slot;
import com.slotlock.slot.entity.SlotStatus;
import com.slotlock.slot.repository.SlotRepository;
import com.slotlock.user.entity.User;
import com.slotlock.user.repository.UserRepository;
import com.slotlock.waitlist.service.WaitlistService;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.dao.OptimisticLockingFailureException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BookingService {
    private final BookingRepository bookingRepository;
    private final SlotRepository slotRepository;
    private final UserRepository userRepository;
    private final BookingTransactionService bookingTransactionService;
    private final WaitlistService waitlistService;

    private static final long CONFIRMATION_WINDOW_MINUTES = 10;

    public BookingResponse createBooking(CreateBookingRequest request)
    {
        String email = getAuthenticatedUserEmail();
        final int maxAttempts = 3;

        for (int attempt = 1; attempt <= maxAttempts; attempt++)
        {
            try {
                return bookingTransactionService.createBookingTransaction(request, email);
            }
            catch (OptimisticLockingFailureException ex)
            {
                if (attempt == maxAttempts) {
                    throw new ConcurrentBookingException(
                            "Slot booking failed because another user booked the slot concurrently"
                    );
                }

                try {
                    Thread.sleep(50L * attempt);
                } catch (InterruptedException interruptedException) {
                    Thread.currentThread().interrupt();
                    throw new InvalidSlotOperationException(
                            "Booking operation was interrupted"
                    );
                }
            }
        }
        throw new InvalidSlotOperationException(
                "Unable to create booking"
        );
    }

    public BookingResponse createBookingPessimistic(CreateBookingRequest request)
    {
        String email = getAuthenticatedUserEmail();
        return bookingTransactionService.createBookingPessimisticTransaction(
                request, email);
    }

    @Transactional
    public BookingResponse confirmBooking(Long bookingId)
    {
        Booking booking = findBookingById(bookingId);
        validateOwnership(booking);

        if(booking.getStatus() != BookingStatus.PENDING)
        {
            throw new InvalidSlotOperationException("Only pending bookings can be confirmed");
        }

        if(LocalDateTime.now().isAfter(booking.getExpiresAt()))
        {
            booking.setStatus(BookingStatus.EXPIRED);

            Slot slot = booking.getSlot();
            slot.setStatus(SlotStatus.AVAILABLE);

            slotRepository.save(slot);
            bookingRepository.save(booking);

            throw new InvalidSlotOperationException("Booking confirmation window has expired");
        }

        booking.setStatus(BookingStatus.CONFIRMED);
        Booking savedBooking = bookingRepository.save(booking);
        return mapToResponse(savedBooking);
    }

    @Transactional
    public void cancelBooking(Long bookingId)
    {
        Booking booking = findBookingById(bookingId);
        validateOwnership(booking);

        if(booking.getStatus() != BookingStatus.PENDING &&
        booking.getStatus() != BookingStatus.CONFIRMED)
        {
            throw new InvalidSlotOperationException("Only pending or confirmed bookings can be cancelled");
        }

        Slot slot = booking.getSlot();
        LocalDateTime slotStartDateTime = LocalDateTime.of(slot.getDate(), slot.getStartTime());

        if(LocalDateTime.now().isAfter(slotStartDateTime))
        {
            throw new InvalidSlotOperationException("Past bookings cannot be cancelled");
        }
        booking.setStatus(BookingStatus.CANCELLED);

        slot.setStatus(SlotStatus.AVAILABLE);

        slotRepository.save(slot);
        bookingRepository.save(booking);
    }

    @Transactional(readOnly = true)
    public List<BookingResponse> getMyBookings()
    {
        String email = getAuthenticatedUserEmail();

        User user = userRepository.findByEmail(email)
                .orElseThrow(()-> new UserNotFoundException("User not found"));

        return bookingRepository
                .findByUserIdOrderByBookedAtDesc(user.getId())
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<BookingResponse> getAllBookings(BookingStatus status,
                                                Long resourceId,
                                                LocalDate date)
    {
        return bookingRepository
                .findAdminBookings(status, resourceId, date)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public BookingResponse getBookingById(Long bookingId)
    {
        Booking booking = findBookingById(bookingId);
        return mapToResponse(booking);
    }

    @Transactional
    public void cancelBookingAsAdmin(Long bookingId) {

        Booking booking = findBookingById(bookingId);

        if (booking.getStatus() != BookingStatus.PENDING &&
                booking.getStatus() != BookingStatus.CONFIRMED) {

            throw new InvalidSlotOperationException(
                    "Only pending or confirmed bookings can be cancelled"
            );
        }

        booking.setStatus(BookingStatus.CANCELLED);

        Slot slot = booking.getSlot();
        slot.setStatus(SlotStatus.AVAILABLE);

        slotRepository.save(slot);
        bookingRepository.save(booking);

        waitlistService.promoteNextWaitlistEntryForSlot(slot.getId());
    }

    private Booking findBookingById(Long bookingId)
    {
        return bookingRepository.findById(bookingId)
                .orElseThrow(()-> new InvalidSlotOperationException
                        ("Booking not found with id: "+bookingId));
    }

    private void validateOwnership(Booking booking)
    {
        String email = getAuthenticatedUserEmail();
        if(!booking.getUser().getEmail().equals(email))
        {
            throw new InvalidSlotOperationException("You can only modify your own booking");
        }
    }

    private String getAuthenticatedUserEmail()
    {
        Authentication authentication = SecurityContextHolder
                .getContext()
                .getAuthentication();

        if(authentication == null || !authentication.isAuthenticated())
        {
            throw new InvalidSlotOperationException("User is not authenticated");
        }
        return authentication.getName();
    }

    private BookingResponse mapToResponse(Booking booking)
    {
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
