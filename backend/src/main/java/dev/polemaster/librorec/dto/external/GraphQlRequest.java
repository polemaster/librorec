package dev.polemaster.librorec.dto.external;

import java.util.Map;

public record GraphQlRequest(String query, Map<String, Object> variables) {
}
