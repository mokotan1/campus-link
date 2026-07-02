package com.campuslink.backend.common.presentation;

import com.campuslink.backend.common.response.ApiResponse;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthController {

	@GetMapping("/api/health")
	public ApiResponse<Map<String, String>> health() {
		return ApiResponse.ok(Map.of("status", "UP"));
	}
}
