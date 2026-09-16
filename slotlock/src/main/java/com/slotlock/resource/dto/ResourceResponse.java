package com.slotlock.resource.dto;

import com.slotlock.resource.entity.ResourceType;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalTime;

@Getter
@AllArgsConstructor
public class ResourceResponse {

    private Long id;
    private String name;
    private ResourceType type;
    private String location;
    private Integer capacity;
    private LocalTime openTime;
    private LocalTime closeTime;
    private Integer slotDurationMins;
    private Boolean active;
}