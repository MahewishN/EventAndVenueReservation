package com.slotlock.booking;

import com.slotlock.booking.dto.BookingResponse;
import com.slotlock.booking.dto.CreateBookingRequest;
import com.slotlock.booking.entity.BookingStatus;
import com.slotlock.booking.repository.BookingRepository;
import com.slotlock.booking.service.BookingService;
import com.slotlock.slot.entity.Slot;
import com.slotlock.slot.entity.SlotStatus;
import com.slotlock.slot.repository.SlotRepository;
import com.slotlock.user.entity.Role;
import com.slotlock.user.entity.User;
import com.slotlock.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.*;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class BookingPessimisticConcurrencyTest {

    @Autowired
    private BookingService bookingService;

    @Autowired
    private SlotRepository slotRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Test
    void exactlyOneUserShouldBookSlotWhen100UsersTrySimultaneouslyUsingPessimisticLock()
            throws Exception {

        // 1. Find an available slot
        Slot slot = slotRepository.findAll().stream()
                .filter(s -> s.getStatus() == SlotStatus.AVAILABLE)
                .findFirst()
                .orElseThrow(() -> new IllegalStateException(
                        "No AVAILABLE slot found for pessimistic concurrency test"
                ));

        Long slotId = slot.getId();

        // 2. Create 100 test users
        List<User> users = new ArrayList<>();

        String uniqueSuffix = String.valueOf(System.currentTimeMillis());

        for (int i = 1; i <= 100; i++) {

            User user = User.builder()
                    .username("pessimistic-user-" + uniqueSuffix + "-" + i)
                    .email("pessimistic-user-" + uniqueSuffix + "-" + i + "@test.com")
                    .password("test-password")
                    .role(Role.USER)
                    .active(true)
                    .build();

            users.add(userRepository.save(user));
        }

        // 3. Create 100 worker threads
        ExecutorService executor = Executors.newFixedThreadPool(100);

        CountDownLatch readyLatch = new CountDownLatch(100);
        CountDownLatch startLatch = new CountDownLatch(1);

        List<Future<BookingResponse>> futures = new ArrayList<>();

        // 4. Prepare all users to compete for the same slot
        for (User user : users) {

            Future<BookingResponse> future = executor.submit(() -> {

                SecurityContext context =
                        SecurityContextHolder.createEmptyContext();

                context.setAuthentication(
                        new UsernamePasswordAuthenticationToken(
                                user.getEmail(),
                                null,
                                List.of()
                        )
                );

                SecurityContextHolder.setContext(context);

                try {

                    // Tell the main thread that this worker is ready
                    readyLatch.countDown();

                    // Wait until all 100 workers are ready
                    startLatch.await();

                    CreateBookingRequest request =
                            new CreateBookingRequest();

                    request.setSlotId(slotId);

                    // IMPORTANT:
                    // This calls the pessimistic-locking path
                    return bookingService.createBookingPessimistic(request);

                } finally {
                    SecurityContextHolder.clearContext();
                }
            });

            futures.add(future);
        }

        // 5. Make sure all 100 workers are ready
        assertTrue(
                readyLatch.await(10, TimeUnit.SECONDS),
                "Not all workers became ready"
        );

        // 6. Release all 100 workers at approximately the same time
        startLatch.countDown();

        // 7. Collect results
        int successfulBookings = 0;
        int failedBookings = 0;

        List<Throwable> failures = new ArrayList<>();

        for (Future<BookingResponse> future : futures) {

            try {

                BookingResponse response =
                        future.get(30, TimeUnit.SECONDS);

                successfulBookings++;

                System.out.println(
                        "SUCCESS -> Booking ID: " + response.getId()
                );

            } catch (ExecutionException ex) {

                failedBookings++;

                Throwable cause = ex.getCause();

                failures.add(cause);

                System.out.println(
                        "FAILED -> "
                                + cause.getClass().getSimpleName()
                                + " : "
                                + cause.getMessage()
                );
            }
        }

        executor.shutdown();

        // 8. Verify exactly one booking succeeded
        assertEquals(
                1,
                successfulBookings,
                "Exactly one booking should succeed"
        );

        // 9. Verify the other 99 failed
        assertEquals(
                99,
                failedBookings,
                "Exactly 99 booking attempts should fail"
        );

        // 10. Verify final slot state
        Slot finalSlot = slotRepository
                .findById(slotId)
                .orElseThrow();

        assertEquals(
                SlotStatus.BOOKED,
                finalSlot.getStatus()
        );

        // 11. Verify there is exactly one active booking
        long activeBookings = bookingRepository.findAll()
                .stream()
                .filter(booking ->
                        booking.getSlot()
                                .getId()
                                .equals(slotId))
                .filter(booking ->
                        booking.getStatus() == BookingStatus.PENDING
                                || booking.getStatus() == BookingStatus.CONFIRMED)
                .count();

        assertEquals(
                1,
                activeBookings,
                "There must be exactly one active booking"
        );

        // 12. Print final result
        System.out.println("======================================");
        System.out.println("PESSIMISTIC CONCURRENCY TEST RESULT");
        System.out.println("======================================");
        System.out.println("Total attempts       : 100");
        System.out.println("Successful bookings  : " + successfulBookings);
        System.out.println("Failed bookings      : " + failedBookings);
        System.out.println("Active bookings      : " + activeBookings);
        System.out.println("Final slot status    : " + finalSlot.getStatus());
        System.out.println("======================================");
    }
}