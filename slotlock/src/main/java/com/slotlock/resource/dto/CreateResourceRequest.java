package com.slotlock.resource.dto;

import com.slotlock.resource.entity.ResourceType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalTime;

@Getter
@Setter
public class CreateResourceRequest {

    @NotBlank(message = "Resource name is required")
    private String name;

    @NotNull(message = "Resource type is required")
    private ResourceType type;

    @NotBlank(message = "Location is required")
    private String location;

    @NotNull(message = "Capacity is required")
    @Min(value = 10, message = "Capacity must be at least 10")
    private Integer capacity;

    @NotNull(message = "Opening time is required")
    private LocalTime openTime;

    @NotNull(message = "Closing time is required")
    private LocalTime closeTime;

    @NotNull(message = "Slot duration is required")
    @Min(value = 30, message = "Slot duration must by at least 30 minutes")
    private Integer slotDurationMins;
}
