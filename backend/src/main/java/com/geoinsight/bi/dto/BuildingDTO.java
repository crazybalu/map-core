package com.geoinsight.bi.dto;

import lombok.Data;
import java.util.Map;

@Data
public class BuildingDTO {
    private String id;
    private String name;
    private String category = "Building";
    private Double lat;
    private Double lng;
    private Integer value;
    private Map<String, Object> attributes;
}
