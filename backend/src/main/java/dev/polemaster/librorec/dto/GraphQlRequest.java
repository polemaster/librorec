package dev.polemaster.librorec.dto;

import java.util.Map;

public record GraphQlRequest(String query, Map<String, Object> variables) {
}
