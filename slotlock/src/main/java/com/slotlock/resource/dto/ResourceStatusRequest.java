package com.slotlock.resource.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ResourceStatusRequest {

    @NotNull(message = "Active status is required")
    private Boolean active;
}
