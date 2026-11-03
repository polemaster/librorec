package dev.polemaster.librorec.dto;


import java.util.List;

public record LLMResponse(List<LLMBookResponse> books) {
    public record LLMBookResponse(String title, List<String> authors) {}
}
