package com.geoinsight.bi.entity;

import lombok.Data;
import org.locationtech.jts.geom.Point;
import javax.persistence.*;
import java.util.List;

@Data
@Entity
@Table(name = "buildings")
public class Building {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    
    private String address;

    private Integer floors;

    @Column(name = "usage")
    private String usage;

    private String area;

    @Column(columnDefinition = "geometry(Point, 4326)")
    private Point geom;

    @OneToMany(mappedBy = "building", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Room> rooms;
}
