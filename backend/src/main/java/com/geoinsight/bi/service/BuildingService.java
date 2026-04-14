package com.geoinsight.bi.service;

import com.geoinsight.bi.dto.BuildingDTO;
import com.geoinsight.bi.entity.Building;
import com.geoinsight.bi.repository.BuildingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BuildingService {

    private final BuildingRepository buildingRepository;

    public List<BuildingDTO> getAllBuildings() {
        return buildingRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<BuildingDTO> searchBuildings(String keyword) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return getAllBuildings();
        }
        return buildingRepository.findByNameContainingIgnoreCase(keyword).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    private BuildingDTO convertToDTO(Building building) {
        BuildingDTO dto = new BuildingDTO();
        dto.setId("building-" + building.getId());
        dto.setName(building.getName());
        
        if (building.getGeom() != null) {
            dto.setLat(building.getGeom().getY());
            dto.setLng(building.getGeom().getX());
        }

        Map<String, Object> attrs = new HashMap<>();
        attrs.put("address", building.getAddress());
        attrs.put("floors", building.getFloors());
        attrs.put("usage", building.getUsage());
        attrs.put("area", building.getArea());
        dto.setAttributes(attrs);
        
        // Mock value for BI display if needed
        dto.setValue((int) (Math.random() * 1000));
        
        return dto;
    }
}
