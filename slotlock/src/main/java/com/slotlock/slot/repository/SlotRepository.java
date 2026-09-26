package com.slotlock.slot.repository;

import com.slotlock.slot.entity.Slot;
import org.springframework.data.jpa.repository.JpaRepository;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;


public interface SlotRepository extends JpaRepository<Slot, Long>{

    boolean existsByResourceIdAndDateAndStartTime(Long resourceId,
                                                  LocalDate date,
                                                  LocalTime startTime);

    List<Slot> findByResourceIdAndDateOrderByStartTime(Long resourceId,
                                                       LocalDate date);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM Slot s WHERE s.id = :slotId")
    java.util.Optional<Slot> findByIdForUpdate(@Param("slotId") Long slotId);

    List<Slot> findByDateBefore(LocalDate date);
}
