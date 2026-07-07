package com.campuslink.backend.common.presentation;

import java.util.List;
import java.util.Map;

import org.springframework.core.env.Environment;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.campuslink.backend.common.config.SupabaseProperties;
import com.campuslink.backend.common.response.ApiResponse;

@RestController
@RequestMapping("/api/infrastructure")
public class SupabaseStatusController {

    private final SupabaseProperties supabaseProperties;
    private final Environment environment;

    public SupabaseStatusController(SupabaseProperties supabaseProperties, Environment environment) {
        this.supabaseProperties = supabaseProperties;
        this.environment = environment;
    }

    @GetMapping("/supabase")
    public ApiResponse<Map<String, Object>> getSupabaseStatus() {
        List<String> activeProfiles = List.of(environment.getActiveProfiles());

        return ApiResponse.ok(Map.of(
                "activeProfiles", activeProfiles,
                "supabaseUrlConfigured", supabaseProperties.hasUrl(),
                "supabasePublishableKeyConfigured", supabaseProperties.hasPublishableKey(),
                "supabaseServiceRoleKeyConfigured", supabaseProperties.hasServiceRoleKey()
        ));
    }
}
