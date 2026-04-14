package com.geoinsight.bi.controller;

import com.geoinsight.bi.common.Result;
import com.geoinsight.bi.dto.BuildingDTO;
import com.geoinsight.bi.service.BuildingService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Api(tags = "建筑物管理")
@RestController
@RequestMapping("/api/buildings")
@RequiredArgsConstructor
public class BuildingController {

    private final BuildingService buildingService;

    @ApiOperation("搜索/查询所有建筑物")
    @GetMapping
    public Result<List<BuildingDTO>> getAllBuildings(
            @org.springframework.web.bind.annotation.RequestParam(required = false) String keyword
    ) {
        List<BuildingDTO> buildings = buildingService.searchBuildings(keyword);
        return Result.success(buildings);
    }
}
