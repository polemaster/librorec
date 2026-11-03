package dev.polemaster.librorec.controller;

import dev.polemaster.librorec.dto.BookRequest;
import dev.polemaster.librorec.dto.BookResponse;
import dev.polemaster.librorec.dto.RecommendationResponse;
import dev.polemaster.librorec.service.RecommendationService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/recommendations")
public class RecommendationController {
    private final RecommendationService recommendationService;

    @PostMapping
    public List<RecommendationResponse> getRecommendations(@RequestBody List<@Valid BookRequest> books) {
        return recommendationService.getRecommendations(books);
    }
}
