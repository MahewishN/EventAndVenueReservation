package com.slotlock.booking;

import com.slotlock.booking.dto.BookingResponse;
import com.slotlock.booking.dto.CreateBookingRequest;
import com.slotlock.booking.service.BookingService;
import com.slotlock.booking.repository.BookingRepository;
import com.slotlock.booking.entity.BookingStatus;
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
class BookingConcurrencyTest {

    @Autowired
    private BookingService bookingService;

    @Autowired
    private SlotRepository slotRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Test
    void exactlyOneUserShouldBookSlotWhen100UsersTrySimultaneously()
            throws Exception {

        /*
         * Find an AVAILABLE slot that we can use for the test.
         */
        Slot slot = slotRepository.findAll()
                .stream()
                .filter(s -> s.getStatus() == SlotStatus.AVAILABLE)
                .findFirst()
                .orElseThrow(() ->
                        new IllegalStateException(
                                "No AVAILABLE slot found for concurrency test"
                        ));

        Long slotId = slot.getId();

        /*
         * Create 100 different users.
         */
        List<User> users = new ArrayList<>();

        for (int i = 1; i <= 100; i++) {

            User user = User.builder()
                    .username("concurrency-user-" + i)
                    .email("concurrency-user-" + i + "@test.com")
                    .password("test-password")
                    .role(Role.USER)
                    .active(true)
                    .build();

            users.add(userRepository.save(user));
        }

        /*
         * 100 worker threads.
         */
        ExecutorService executor =
                Executors.newFixedThreadPool(100);

        /*
         * This barrier makes all workers wait until all 100
         * booking tasks are ready to start.
         */
        CountDownLatch readyLatch =
                new CountDownLatch(100);

        CountDownLatch startLatch =
                new CountDownLatch(1);

        List<Future<BookingResponse>> futures =
                new ArrayList<>();

        /*
         * Submit 100 simultaneous booking attempts.
         */
        for (User user : users) {

            Future<BookingResponse> future =
                    executor.submit(() -> {

                        /*
                         * Each worker gets its own SecurityContext.
                         */
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

                            readyLatch.countDown();

                            /*
                             * Wait until all 100 workers are ready.
                             */
                            startLatch.await();

                            CreateBookingRequest request =
                                    new CreateBookingRequest();
                            request.setSlotId(slotId);

                            return bookingService.createBooking(request);

                        } finally {

                            /*
                             * SecurityContext is thread-local.
                             * Always clear it after the task.
                             */
                            SecurityContextHolder.clearContext();
                        }
                    });

            futures.add(future);
        }

        /*
         * Wait until all 100 tasks are ready.
         */
        assertTrue(
                readyLatch.await(10, TimeUnit.SECONDS),
                "Not all workers became ready"
        );

        /*
         * Release all workers at approximately the same time.
         */
        startLatch.countDown();

        int successfulBookings = 0;
        int failedBookings = 0;

        List<Throwable> failures = new ArrayList<>();

        /*
         * Collect all results.
         */
        for (Future<BookingResponse> future : futures) {

            try {

                BookingResponse response = future.get(
                        30,
                        TimeUnit.SECONDS
                );

                successfulBookings++;

                System.out.println(
                        "SUCCESS -> Booking ID: "
                                + response.getId()
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

        /*
         * Exactly one request must succeed.
         */
        assertEquals(
                1,
                successfulBookings,
                "Exactly one booking should succeed"
        );

        /*
         * The other 99 requests must fail.
         */
        assertEquals(
                99,
                failedBookings,
                "Exactly 99 booking attempts should fail"
        );

        /*
         * Verify database state.
         */
        Slot finalSlot = slotRepository.findById(slotId)
                .orElseThrow();

        assertEquals(
                SlotStatus.BOOKED,
                finalSlot.getStatus()
        );

        /*
         * There must be exactly one active booking
         * for this slot.
         */
        long activeBookings =
                bookingRepository
                        .findAll()
                        .stream()
                        .filter(booking ->
                                booking.getSlot().getId().equals(slotId))
                        .filter(booking ->
                                booking.getStatus() == BookingStatus.PENDING
                                        || booking.getStatus() == BookingStatus.CONFIRMED)
                        .count();

        assertEquals(
                1,
                activeBookings,
                "There must be exactly one active booking"
        );

        System.out.println();
        System.out.println("======================================");
        System.out.println("CONCURRENCY TEST RESULT");
        System.out.println("======================================");
        System.out.println(
                "Total attempts       : 100"
        );
        System.out.println(
                "Successful bookings  : " + successfulBookings
        );
        System.out.println(
                "Failed bookings      : " + failedBookings
        );
        System.out.println(
                "Active bookings      : " + activeBookings
        );
        System.out.println(
                "Final slot status    : " + finalSlot.getStatus()
        );
        System.out.println("======================================");
    }
}