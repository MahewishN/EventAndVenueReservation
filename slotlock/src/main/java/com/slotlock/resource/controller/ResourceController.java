package com.slotlock.resource.controller;

import com.slotlock.resource.dto.CreateResourceRequest;
import com.slotlock.resource.dto.ResourceResponse;
import com.slotlock.resource.dto.ResourceStatusRequest;
import com.slotlock.resource.dto.UpdateResourceRequest;
import com.slotlock.resource.service.ResourceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/resources")
@RequiredArgsConstructor
public class ResourceController {
    private final ResourceService resourceService;

    @GetMapping
    public ResponseEntity<List<ResourceResponse>> getAllResources()
    {
        return ResponseEntity.ok(resourceService.getAllResources());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ResourceResponse> getResourceById(@PathVariable Long id)
    {
        return ResponseEntity.ok(resourceService.getResourceById(id));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<ResourceResponse> createResource(
            @Valid @RequestBody CreateResourceRequest request)
    {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(resourceService.createResource(request));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/{id}")
    public ResponseEntity<ResourceResponse> updateResource(
            @PathVariable Long id,
            @Valid @RequestBody UpdateResourceRequest request)
    {
        return ResponseEntity.ok(resourceService.updateResource(id, request));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/{id}/status")
    public ResponseEntity<ResourceResponse> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody ResourceStatusRequest request)
    {
        return ResponseEntity.ok(resourceService.updateStatus(id, request));
    }
}
