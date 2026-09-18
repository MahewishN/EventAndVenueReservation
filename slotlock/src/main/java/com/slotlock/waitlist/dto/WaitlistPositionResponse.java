package com.slotlock.waitlist.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class WaitlistPositionResponse {
    private Long waitlistEntryId;
    private Long slotId;
    private int position;
}
