package com.geoinsight.bi.service;

import com.geoinsight.bi.dto.SurveillanceDTO;
import com.geoinsight.bi.entity.Surveillance;
import com.geoinsight.bi.repository.SurveillanceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SurveillanceService {

    private final SurveillanceRepository surveillanceRepository;

    public List<SurveillanceDTO> getAllSurveillances() {
        return surveillanceRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<SurveillanceDTO> searchSurveillances(String keyword, Double minLng, Double minLat, Double maxLng, Double maxLat) {
        String finalKeyword = (keyword == null || keyword.trim().isEmpty()) ? null : keyword.trim();
        return surveillanceRepository.searchSurveillancesWithExtent(finalKeyword, minLng, minLat, maxLng, maxLat).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    private SurveillanceDTO convertToDTO(Surveillance surveillance) {
        SurveillanceDTO dto = new SurveillanceDTO();
        dto.setId("surveillance-" + surveillance.getId());
        dto.setName(surveillance.getName());
        
        if (surveillance.getGeom() != null) {
            dto.setLat(surveillance.getGeom().getY());
            dto.setLng(surveillance.getGeom().getX());
        }

        Map<String, Object> attrs = new HashMap<>();
        attrs.put("address", surveillance.getAddress());
        attrs.put("status", surveillance.getStatus());
        attrs.put("resolution", surveillance.getResolution());
        attrs.put("installDate", surveillance.getInstallDate());
        dto.setAttributes(attrs);
        
        // Mock value for BI display if needed
        dto.setValue((int) (Math.random() * 1000));
        
        return dto;
    }
}
