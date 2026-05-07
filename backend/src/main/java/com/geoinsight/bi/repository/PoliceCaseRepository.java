package com.geoinsight.bi.repository;

import com.geoinsight.bi.entity.PoliceCase;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PoliceCaseRepository extends JpaRepository<PoliceCase, Long> {
    List<PoliceCase> findByNameContainingIgnoreCase(String name);
}
