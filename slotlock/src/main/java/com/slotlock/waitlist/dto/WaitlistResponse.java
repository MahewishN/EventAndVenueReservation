package com.slotlock.waitlist.dto;

import com.slotlock.waitlist.entity.WaitlistStatus;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
public class WaitlistResponse {
    private Long id;
    private Long slotId;
    private Long resourceId;
    private String resourceName;
    private Long userId;
    private LocalDateTime joinedAt;
    private WaitlistStatus status;
    private LocalDateTime offeredAt;
    private LocalDateTime expiresAt;
}
