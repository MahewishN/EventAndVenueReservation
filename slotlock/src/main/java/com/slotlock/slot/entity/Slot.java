package com.slotlock.slot.entity;

import com.slotlock.resource.entity.Resource;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name ="slots", uniqueConstraints = {@UniqueConstraint(name="uk_resource_date_start_time",
                                        columnNames = {"resource_id", "slot_date","start_time"})
        })

public class Slot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name= "resource_id", nullable = false)
    private Resource resource;

    @Column(name= "slot_date", nullable = false)
    private LocalDate date;

    @Column(name= "start_time", nullable = false)
    private LocalTime startTime;

    @Column(name= "end_time", nullable = false)
    private LocalTime endTime;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private SlotStatus status = SlotStatus.AVAILABLE;

    @Version
    private Long version;
}
