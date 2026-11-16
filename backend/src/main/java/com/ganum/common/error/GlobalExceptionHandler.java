package com.ganum.common.error;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingRequestHeaderException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

@RestControllerAdvice
public class GlobalExceptionHandler {

	private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

	@ExceptionHandler(ApiException.class)
	ResponseEntity<ErrorResponse> handleApi(ApiException e) {
		return respond(e.code(), e.getMessage(), e.fields());
	}

	@ExceptionHandler(MethodArgumentNotValidException.class)
	ResponseEntity<ErrorResponse> handleBodyValidation(MethodArgumentNotValidException e) {
		List<ErrorResponse.FieldError> fields = e.getBindingResult().getFieldErrors().stream()
				.map(f -> new ErrorResponse.FieldError(f.getField(), f.getDefaultMessage()))
				.toList();
		return respond(ErrorCode.VALIDATION_ERROR, ErrorCode.VALIDATION_ERROR.defaultMessage(), fields);
	}

	@ExceptionHandler(HandlerMethodValidationException.class)
	ResponseEntity<ErrorResponse> handleParamValidation(HandlerMethodValidationException e) {
		List<ErrorResponse.FieldError> fields = e.getParameterValidationResults().stream()
				.flatMap(r -> r.getResolvableErrors().stream()
						.map(err -> new ErrorResponse.FieldError(
								r.getMethodParameter().getParameterName(), err.getDefaultMessage())))
				.toList();
		return respond(ErrorCode.VALIDATION_ERROR, ErrorCode.VALIDATION_ERROR.defaultMessage(), fields);
	}

	@ExceptionHandler(MethodArgumentTypeMismatchException.class)
	ResponseEntity<ErrorResponse> handleTypeMismatch(MethodArgumentTypeMismatchException e) {
		return respond(ErrorCode.VALIDATION_ERROR, ErrorCode.VALIDATION_ERROR.defaultMessage(),
				List.of(new ErrorResponse.FieldError(e.getName(), "형식이 올바르지 않아요.")));
	}

	@ExceptionHandler(MissingServletRequestParameterException.class)
	ResponseEntity<ErrorResponse> handleMissingParam(MissingServletRequestParameterException e) {
		return respond(ErrorCode.VALIDATION_ERROR, ErrorCode.VALIDATION_ERROR.defaultMessage(),
				List.of(new ErrorResponse.FieldError(e.getParameterName(), "필수 값이에요.")));
	}

	@ExceptionHandler(MissingRequestHeaderException.class)
	ResponseEntity<ErrorResponse> handleMissingHeader(MissingRequestHeaderException e) {
		return respond(ErrorCode.INVALID_REQUEST, e.getHeaderName() + " 헤더가 필요해요.", List.of());
	}

	@ExceptionHandler(HttpMessageNotReadableException.class)
	ResponseEntity<ErrorResponse> handleUnreadable(HttpMessageNotReadableException e) {
		return respond(ErrorCode.INVALID_REQUEST, ErrorCode.INVALID_REQUEST.defaultMessage(), List.of());
	}

	@ExceptionHandler(NoResourceFoundException.class)
	ResponseEntity<ErrorResponse> handleNoResource(NoResourceFoundException e) {
		return respond(ErrorCode.NOT_FOUND, ErrorCode.NOT_FOUND.defaultMessage(), List.of());
	}

	@ExceptionHandler(HttpRequestMethodNotSupportedException.class)
	ResponseEntity<ErrorResponse> handleMethod(HttpRequestMethodNotSupportedException e) {
		return respond(ErrorCode.METHOD_NOT_ALLOWED, ErrorCode.METHOD_NOT_ALLOWED.defaultMessage(), List.of());
	}

	@ExceptionHandler(Exception.class)
	ResponseEntity<ErrorResponse> handleUnknown(Exception e) {
		log.error("Unhandled exception", e);
		return respond(ErrorCode.INTERNAL_ERROR, ErrorCode.INTERNAL_ERROR.defaultMessage(), List.of());
	}

	private ResponseEntity<ErrorResponse> respond(ErrorCode code, String message,
			List<ErrorResponse.FieldError> fields) {
		return ResponseEntity.status(code.status()).body(ErrorResponse.of(code.name(), message, fields));
	}
}
