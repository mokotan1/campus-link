package com.campuslink.backend.common.response;

import java.util.List;

public record ErrorBody(
	String code,
	String message,
	List<ErrorField> fields
) {
}
