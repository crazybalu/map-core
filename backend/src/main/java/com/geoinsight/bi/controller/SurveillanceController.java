package com.geoinsight.bi.controller;

import com.geoinsight.bi.common.Result;
import com.geoinsight.bi.dto.SurveillanceDTO;
import com.geoinsight.bi.service.SurveillanceService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Api(tags = "监控管理")
@RestController
@RequestMapping("/api/surveillances")
@RequiredArgsConstructor
public class SurveillanceController {

    private final SurveillanceService surveillanceService;

    @ApiOperation("搜索/查询所有监控")
    @GetMapping
    public Result<List<SurveillanceDTO>> getAllSurveillances(
            @RequestParam(required = false) String keyword
    ) {
        List<SurveillanceDTO> surveillances = surveillanceService.searchSurveillances(keyword);
        return Result.success(surveillances);
    }
}
