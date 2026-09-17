package com.slotlock.slot.repository;

import com.slotlock.slot.entity.Slot;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;


public interface SlotRepository extends JpaRepository<Slot, Long>{

    boolean existsByResourceIdAndDateAndStartTime(Long resourceId,
                                                  LocalDate date,
                                                  LocalTime startTime);

    List<Slot> findByResourceIdAndDateOrderByStartTime(Long resourceId,
                                                       LocalDate date);
}
