package com.campuslink.backend.common.exception;

import com.campuslink.backend.common.response.ErrorBody;
import com.campuslink.backend.common.response.ErrorField;
import com.campuslink.backend.common.response.ErrorResponse;
import jakarta.validation.ConstraintViolationException;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

	@ExceptionHandler(MethodArgumentNotValidException.class)
	public ResponseEntity<ErrorResponse> handleMethodArgumentNotValid(MethodArgumentNotValidException exception) {
		List<ErrorField> fields = exception.getBindingResult()
			.getFieldErrors()
			.stream()
			.map(error -> new ErrorField(error.getField(), error.getDefaultMessage()))
			.toList();

		return build(ErrorCode.VALIDATION_ERROR, fields);
	}

	@ExceptionHandler(ConstraintViolationException.class)
	public ResponseEntity<ErrorResponse> handleConstraintViolation(ConstraintViolationException exception) {
		List<ErrorField> fields = exception.getConstraintViolations()
			.stream()
			.map(violation -> new ErrorField(violation.getPropertyPath().toString(), violation.getMessage()))
			.toList();

		return build(ErrorCode.VALIDATION_ERROR, fields);
	}

	@ExceptionHandler(Exception.class)
	public ResponseEntity<ErrorResponse> handleException(Exception exception) {
		return build(ErrorCode.INTERNAL_ERROR, List.of());
	}

	private ResponseEntity<ErrorResponse> build(ErrorCode errorCode, List<ErrorField> fields) {
		ErrorBody error = new ErrorBody(errorCode.name(), errorCode.message(), fields);
		return ResponseEntity.status(errorCode.status()).body(ErrorResponse.of(error));
	}
}
