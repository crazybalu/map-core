package com.geoinsight.bi.controller;

import com.geoinsight.bi.common.Result;
import com.geoinsight.bi.dto.PoliceCaseDTO;
import com.geoinsight.bi.service.PoliceCaseService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Api(tags = "警情管理")
@RestController
@RequestMapping("/api/cases")
@RequiredArgsConstructor
public class PoliceCaseController {

    private final PoliceCaseService policeCaseService;

    @ApiOperation("搜索/查询所有警情")
    @GetMapping
    public Result<List<PoliceCaseDTO>> getAllPoliceCases(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Double minLng,
            @RequestParam(required = false) Double minLat,
            @RequestParam(required = false) Double maxLng,
            @RequestParam(required = false) Double maxLat
    ) {
        List<PoliceCaseDTO> cases = policeCaseService.searchPoliceCases(keyword, minLng, minLat, maxLng, maxLat);
        return Result.success(cases);
    }
}
