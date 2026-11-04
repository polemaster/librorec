package dev.polemaster.librorec.controller;

import dev.polemaster.librorec.dto.BookRequest;
import dev.polemaster.librorec.dto.RecommendationMethod;
import dev.polemaster.librorec.dto.RecommendationResponse;
import dev.polemaster.librorec.service.RecommendationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/recommendations")
public class RecommendationController {
    private final RecommendationService recommendationService;

    @PostMapping
    public List<RecommendationResponse> getRecommendations(
            @RequestParam(defaultValue = "GEMINI") RecommendationMethod method,
            @RequestBody List<@Valid BookRequest> books) {
        return recommendationService.getRecommendations(books, method);
    }
}
