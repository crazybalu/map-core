package com.geoinsight.bi.dto;

import lombok.Data;
import java.util.Map;

@Data
public class PoliceCaseDTO {
    private String id;
    private String name;
    private String category = "PoliceCase";
    private Double lat;
    private Double lng;
    private Integer value;
    private Map<String, Object> attributes;
}
