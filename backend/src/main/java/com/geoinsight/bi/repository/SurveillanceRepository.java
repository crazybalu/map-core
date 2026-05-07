package com.geoinsight.bi.repository;

import com.geoinsight.bi.entity.Surveillance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SurveillanceRepository extends JpaRepository<Surveillance, Long> {
    List<Surveillance> findByNameContainingIgnoreCase(String name);
}
