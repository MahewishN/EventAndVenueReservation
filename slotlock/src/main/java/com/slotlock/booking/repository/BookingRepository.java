package com.slotlock.booking.repository;

import com.slotlock.booking.entity.Booking;
import com.slotlock.booking.entity.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BookingRepository extends JpaRepository<Booking, Long> {

    List<Booking> findByUserIdOrderByBookedAtDesc(Long userId);

    boolean existsBySlotIdAndStatusIn(Long slotId, List<Booking> statuses);

    List<Booking> findByStatusAndExpiresAtBefore(BookingStatus status,
                                                 java.time.LocalDateTime time);

}
