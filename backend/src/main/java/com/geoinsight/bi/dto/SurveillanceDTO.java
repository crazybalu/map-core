package com.geoinsight.bi.dto;

import lombok.Data;
import java.util.Map;

@Data
public class SurveillanceDTO {
    private String id;
    private String name;
    private String category = "Surveillance";
    private Double lat;
    private Double lng;
    private Integer value;
    private Map<String, Object> attributes;
}
