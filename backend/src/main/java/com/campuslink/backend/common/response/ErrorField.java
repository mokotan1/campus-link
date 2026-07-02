package com.campuslink.backend.common.response;

public record ErrorField(
	String field,
	String message
) {
}
