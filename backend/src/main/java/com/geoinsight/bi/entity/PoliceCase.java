package com.geoinsight.bi.entity;

import lombok.Data;
import org.locationtech.jts.geom.Point;
import javax.persistence.*;

@Data
@Entity
@Table(name = "police_case")
public class PoliceCase {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    
    private String address;

    private String level;

    private String status;

    @Column(name = "report_time")
    private String reportTime;

    @Column(columnDefinition = "geometry(Point, 4326)")
    private Point geom;
}
