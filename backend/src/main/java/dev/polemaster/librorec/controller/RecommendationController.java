package dev.polemaster.librorec.controller;

import dev.polemaster.librorec.dto.book.BookRequest;
import dev.polemaster.librorec.dto.book.BookSearchApi;
import dev.polemaster.librorec.dto.recommendation.RecommendationMethod;
import dev.polemaster.librorec.dto.recommendation.RecommendationResponse;
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
            @RequestParam(defaultValue = "HARDCOVER") BookSearchApi api,
            @RequestBody List<@Valid BookRequest> books) {
        return recommendationService.getRecommendations(books, method, api);
    }
}
