package com.geoinsight.bi.repository;

import com.geoinsight.bi.entity.Surveillance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SurveillanceRepository extends JpaRepository<Surveillance, Long> {
    List<Surveillance> findByNameContainingIgnoreCase(String name);

    @Query(value = "SELECT * FROM surveillance b WHERE (:keyword IS NULL OR b.name ILIKE CONCAT('%', :keyword, '%')) " +
                   "AND (:minLng IS NULL OR :minLat IS NULL OR :maxLng IS NULL OR :maxLat IS NULL OR " +
                   "ST_Intersects(b.geom, ST_MakeEnvelope(:minLng, :minLat, :maxLng, :maxLat, 4326)))", nativeQuery = true)
    List<Surveillance> searchSurveillancesWithExtent(@Param("keyword") String keyword, 
                                                     @Param("minLng") Double minLng, @Param("minLat") Double minLat, 
                                                     @Param("maxLng") Double maxLng, @Param("maxLat") Double maxLat);
}
