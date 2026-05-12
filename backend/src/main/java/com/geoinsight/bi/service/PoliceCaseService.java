package com.geoinsight.bi.service;

import com.geoinsight.bi.dto.PoliceCaseDTO;
import com.geoinsight.bi.entity.PoliceCase;
import com.geoinsight.bi.repository.PoliceCaseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PoliceCaseService {

    private final PoliceCaseRepository policeCaseRepository;

    public List<PoliceCaseDTO> getAllPoliceCases() {
        return policeCaseRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<PoliceCaseDTO> searchPoliceCases(String keyword, Double minLng, Double minLat, Double maxLng, Double maxLat) {
        String finalKeyword = (keyword == null || keyword.trim().isEmpty()) ? null : keyword.trim();
        return policeCaseRepository.searchCasesWithExtent(finalKeyword, minLng, minLat, maxLng, maxLat).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    private PoliceCaseDTO convertToDTO(PoliceCase policeCase) {
        PoliceCaseDTO dto = new PoliceCaseDTO();
        dto.setId("policecase-" + policeCase.getId());
        dto.setName(policeCase.getName());
        
        if (policeCase.getGeom() != null) {
            dto.setLat(policeCase.getGeom().getY());
            dto.setLng(policeCase.getGeom().getX());
        }

        Map<String, Object> attrs = new HashMap<>();
        attrs.put("address", policeCase.getAddress());
        attrs.put("level", policeCase.getLevel());
        attrs.put("status", policeCase.getStatus());
        attrs.put("reportTime", policeCase.getReportTime());
        dto.setAttributes(attrs);
        
        // Mock value for BI display if needed
        dto.setValue((int) (Math.random() * 1000));
        
        return dto;
    }
}
