package com.geoinsight.bi.entity;

import lombok.Data;
import org.locationtech.jts.geom.Point;
import javax.persistence.*;

@Data
@Entity
@Table(name = "surveillance")
public class Surveillance {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    
    private String address;

    private String status;

    private String resolution;

    @Column(name = "install_date")
    private String installDate;

    @Column(columnDefinition = "geometry(Point, 4326)")
    private Point geom;
}
