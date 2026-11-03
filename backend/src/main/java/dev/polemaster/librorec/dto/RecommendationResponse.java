package dev.polemaster.librorec.dto;

import java.util.List;



public record RecommendationResponse(String slug, String title, String releaseDate,
                           String coverImgUrl, String seriesName, String description,
                           List<String> authors, List<String> genres) {

    public static RecommendationResponse from(HardcoverResponse.Document doc) {
        return new RecommendationResponse(
                doc.slug(),
                doc.title(),
                doc.release_date(),
                doc.coverUrl(),
                doc.seriesName(),
                doc.description(),
                doc.author_names(),
                doc.genres()
        );
    }
}

