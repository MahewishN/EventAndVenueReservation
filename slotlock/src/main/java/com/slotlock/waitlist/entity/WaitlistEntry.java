package com.slotlock.waitlist.entity;

import com.slotlock.slot.entity.Slot;
import com.slotlock.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder

@Entity
@Table(name="waitlist_entries", uniqueConstraints = {
        @UniqueConstraint(name="uk_waitlist_slot_user",columnNames = {"slot_id","user_id"})
    })

public class WaitlistEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name ="slot_id", nullable = false)
    private Slot slot;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name="user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private LocalDateTime joinedAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private WaitlistStatus status;

    private LocalDateTime offeredAt;

    private LocalDateTime expiresAt;

}
