package com.campuslink.backend.common.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "supabase")
public record SupabaseProperties(
        String url,
        String publishableKey,
        String serviceRoleKey
) {

    public boolean hasUrl() {
        return hasText(url);
    }

    public boolean hasPublishableKey() {
        return hasText(publishableKey);
    }

    public boolean hasServiceRoleKey() {
        return hasText(serviceRoleKey);
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
