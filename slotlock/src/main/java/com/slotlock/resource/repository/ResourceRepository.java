package com.slotlock.resource.repository;

import com.slotlock.resource.entity.Resource;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ResourceRepository extends JpaRepository<Resource, Long> {

    boolean existsByNameIgnoreCaseAndLocationIgnoreCase(
            String name, String location);

    boolean existsByNameIgnoreCaseAndLocationIgnoreCaseAndIdNot(
            String name, String location, Long id);
}
