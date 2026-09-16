package com.slotlock.resource.service;

import com.slotlock.exception.ResourceAlreadyExistsException;
import com.slotlock.exception.ResourceNotFoundException;
import com.slotlock.resource.dto.CreateResourceRequest;
import com.slotlock.resource.dto.ResourceResponse;
import com.slotlock.resource.dto.ResourceStatusRequest;
import com.slotlock.resource.dto.UpdateResourceRequest;
import com.slotlock.resource.entity.Resource;
import com.slotlock.resource.repository.ResourceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ResourceService {

    private final ResourceRepository resourceRepository;

    public ResourceResponse createResource(CreateResourceRequest request)
    {
        validateTimeConfiguration(request.getOpenTime(), request.getCloseTime());

        if(resourceRepository.existsByNameIgnoreCaseAndLocationIgnoreCase(
                request.getName().trim(),
                request.getLocation().trim()))
        {
            throw new ResourceAlreadyExistsException("A resource with the same name and location already exists");
        }

        Resource resource = Resource.builder()
                .name(request.getName().trim())
                .type(request.getType())
                .location(request.getLocation())
                .capacity(request.getCapacity())
                .openTime(request.getOpenTime())
                .closeTime(request.getCloseTime())
                .slotDuration(request.getSlotDurationMins())
                .active(true)
                .build();

        Resource savedResource = resourceRepository.save(resource);
        return mapToResponse(savedResource);
    }

    public List<ResourceResponse> getAllResources()
    {
        return resourceRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    public ResourceResponse getResourceById(Long id)
    {
        Resource resource = findResourceById(id);
        return mapToResponse(resource);
    }

    public ResourceResponse updateResource(Long id, UpdateResourceRequest request)
    {
        validateTimeConfiguration(request.getOpenTime(),
                request.getCloseTime());

        Resource resource = findResourceById(id);
        if(resourceRepository.existsByNameIgnoreCaseAndLocationIgnoreCaseAndIdNot(
                request.getName().trim(),
                request.getLocation().trim(),
                id))
        {
            throw new ResourceAlreadyExistsException("A resource with the same name and location already exists");
        }

        resource.setName(request.getName().trim());
        resource.setType(request.getType());
        resource.setLocation(request.getLocation().trim());
        resource.setCapacity(request.getCapacity());
        resource.setOpenTime(request.getOpenTime());
        resource.setCloseTime(request.getCloseTime());
        resource.setSlotDuration(request.getSlotDurationMins());

        Resource updatedResource = resourceRepository.save(resource);
        return mapToResponse(updatedResource);
    }

    public ResourceResponse updateStatus(Long id, ResourceStatusRequest request)
    {
        Resource resource = findResourceById(id);
        resource.setActive(request.getActive());
        Resource updatedResource = resourceRepository.save(resource);
        return mapToResponse(updatedResource);
    }

    private Resource findResourceById(Long id)
    {
        return resourceRepository.findById(id)
                .orElseThrow(()->
                        new ResourceNotFoundException("Resource not found with id "+id));
    }

    private void validateTimeConfiguration(
            java.time.LocalTime openTime,
            java.time.LocalTime closeTime)
    {
        if(!openTime.isBefore(closeTime))
        {
            throw new IllegalArgumentException("Opening time must be before closing time");
        }
    }

    private ResourceResponse mapToResponse(Resource resource)
    {
        return new ResourceResponse(
                resource.getId(),
                resource.getName(),
                resource.getType(),
                resource.getLocation(),
                resource.getCapacity(),
                resource.getOpenTime(),
                resource.getCloseTime(),
                resource.getSlotDuration(),
                resource.getActive()
        );
    }
}
