package dev.polemaster.librorec.exception;

import jakarta.validation.ConstraintViolationException;
import lombok.extern.slf4j.Slf4j;
import org.jspecify.annotations.NullMarked;
import org.jspecify.annotations.Nullable;
import org.springframework.beans.TypeMismatchException;
import org.springframework.context.MessageSourceResolvable;
//import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.validation.ObjectError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

import java.util.*;

@Slf4j
@NullMarked
@RestControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

    // 1. Validation on @RequestBody or @ModelAttribute DTOs (@Valid / @Validated)
    @Override
    protected @Nullable ResponseEntity<Object> handleMethodArgumentNotValid(
            MethodArgumentNotValidException ex,
            HttpHeaders headers,
            HttpStatusCode status,
            WebRequest request) {

        ProblemDetail problem = ex.getBody();
        problem.setTitle("Validation Failed");
        problem.setDetail("One or more fields failed validation.");

        Map<String, List<String>> errors = new LinkedHashMap<>();
        for (FieldError fieldError : ex.getBindingResult().getFieldErrors()) {
            errors.computeIfAbsent(fieldError.getField(), k -> new ArrayList<>())
                    .add(Objects.requireNonNullElse(fieldError.getDefaultMessage(), "Invalid value"));
        }
        for (ObjectError globalError : ex.getBindingResult().getGlobalErrors()) {
            errors.computeIfAbsent(globalError.getObjectName(), k -> new ArrayList<>())
                    .add(Objects.requireNonNullElse(globalError.getDefaultMessage(), "Validation error"));
        }
        problem.setProperty("errors", errors);

        return handleExceptionInternal(ex, problem, headers, status, request);
    }

    // 2. Validation directly on Controller Method Parameters (@RequestParam, @PathVariable, List<@Valid DTO>)
    @Override
    protected @Nullable ResponseEntity<Object> handleHandlerMethodValidationException(
            HandlerMethodValidationException ex,
            HttpHeaders headers,
            HttpStatusCode status,
            WebRequest request) {

        ProblemDetail problem = ex.getBody();
        problem.setTitle("Parameter Validation Failed");
        problem.setDetail("One or more request parameters failed validation.");
        log.warn(ex.getMessage());

        Map<String, List<String>> errors = new LinkedHashMap<>();
        ex.getParameterValidationResults().forEach(result -> {
            String paramName = result.getMethodParameter().getParameterName();
            String key = paramName != null ? paramName : "parameter";
            for (MessageSourceResolvable error : result.getResolvableErrors()) {
                if (error instanceof FieldError fieldError) {
                    errors.computeIfAbsent(key + "." + fieldError.getField(), k -> new ArrayList<>())
                            .add(Objects.requireNonNullElse(fieldError.getDefaultMessage(), "Invalid value"));
                } else {
                    errors.computeIfAbsent(key, k -> new ArrayList<>())
                            .add(Objects.requireNonNullElse(error.getDefaultMessage(), "Validation error"));
                }
            }
        });
        problem.setProperty("errors", errors);

        return handleExceptionInternal(ex, problem, headers, status, request);
    }

    // 3. Service-layer (@Validated) or JPA Entity Constraint Violations
    @ExceptionHandler(ConstraintViolationException.class)
    public ProblemDetail handleConstraintViolation(ConstraintViolationException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
                HttpStatus.BAD_REQUEST, "Constraint validation failed.");
        problem.setTitle("Constraint Violation");

        Map<String, List<String>> errors = new LinkedHashMap<>();
        ex.getConstraintViolations().forEach(violation ->
                errors.computeIfAbsent(violation.getPropertyPath().toString(), k -> new ArrayList<>())
                        .add(violation.getMessage())
        );
        problem.setProperty("errors", errors);
        return problem;
    }

    // 4. Malformed JSON, Invalid Enum, or Unreadable Payload
    @Override
    protected @Nullable ResponseEntity<Object> handleHttpMessageNotReadable(
            HttpMessageNotReadableException ex,
            HttpHeaders headers,
            HttpStatusCode status,
            WebRequest request) {

        ProblemDetail problem = createProblemDetail(
                ex, status, "Malformed JSON request or invalid field format.", null, null, request);
        problem.setTitle("Unreadable Request Payload");
        return handleExceptionInternal(ex, problem, headers, status, request);
    }

    // 5. Type Mismatch on Path Variables or Query Parameters (Overrides superclass method)
    @Override
    protected @Nullable ResponseEntity<Object> handleTypeMismatch(
            TypeMismatchException ex,
            HttpHeaders headers,
            HttpStatusCode status,
            WebRequest request) {

        String paramName = (ex instanceof MethodArgumentTypeMismatchException mismatchEx)
                ? mismatchEx.getName()
                : ex.getPropertyName();

        String expectedType = ex.getRequiredType() != null
                ? ex.getRequiredType().getSimpleName()
                : "valid type";

        String detail = String.format("Parameter '%s' with value '%s' could not be converted to %s.",
                paramName, ex.getValue(), expectedType);

        ProblemDetail problem = createProblemDetail(ex, status, detail, null, null, request);
        problem.setTitle("Type Mismatch");

        return handleExceptionInternal(ex, problem, headers, status, request);
    }

    // 6. Database Constraint Violations (e.g., Duplicate Key)
//    @ExceptionHandler(DataIntegrityViolationException.class)
//    public ProblemDetail handleDataIntegrityViolation(DataIntegrityViolationException ex) {
//        log.warn("Database constraint violation: {}", ex.getMostSpecificCause().getMessage());
//        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
//                HttpStatus.CONFLICT, "Database constraint violation occurred.");
//        problem.setTitle("Data Conflict");
//        return problem;
//    }

    // 7. Catch-all for Any Unhandled Exceptions (500)
    @ExceptionHandler(Exception.class)
    public ProblemDetail handleAllUncaughtException(Exception ex) throws Exception {
        // Optional: If using Spring Security, let security exceptions bubble up to the filter chain
        // if (ex instanceof AccessDeniedException || ex instanceof AuthenticationException) throw ex;

        log.error("Unhandled exception occurred", ex);
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
                HttpStatus.INTERNAL_SERVER_ERROR, "An unexpected internal error occurred.");
        problem.setTitle("Internal Server Error");
        return problem;
    }
}
