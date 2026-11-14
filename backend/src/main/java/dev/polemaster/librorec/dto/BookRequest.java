package dev.polemaster.librorec.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PastOrPresent;

import java.time.LocalDate;
import java.util.List;


public record BookRequest(
        @NotBlank String id,
        @NotBlank String title,
        @PastOrPresent LocalDate releaseDate,
        List<String> authors, List<String> genres,
        List<String> moods, List<String> tags) {

    public BookRequest {
        authors = (authors != null) ? authors : List.of();
        genres = (genres != null) ? genres : List.of();
        moods = (moods != null) ? moods : List.of();
        tags = (tags != null) ? tags : List.of();
    }
}
