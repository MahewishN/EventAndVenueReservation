package com.slotlock.waitlist.repository;

import com.slotlock.waitlist.entity.WaitlistEntry;
import com.slotlock.waitlist.entity.WaitlistStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface WaitlistRepository extends JpaRepository<WaitlistEntry, Long> {

    boolean existsBySlotIdAndUserIdAndStatus(Long slotId,
                                             Long userId,
                                             WaitlistStatus status);

    Optional<WaitlistEntry> findBySlotIdAndUserIdAndStatus(Long slotId,
                                                           Long userId,
                                                           WaitlistStatus status);

    List<WaitlistEntry> findBYSlotIdAndStatusOrderByJoinedAtAsc(Long slotId,
                                                                WaitlistStatus status);

    List<WaitlistEntry> findByUserIdOrderByJoinedAtDesc(Long userId);
}
