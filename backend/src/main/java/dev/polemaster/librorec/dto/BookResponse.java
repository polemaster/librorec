package dev.polemaster.librorec.dto;

import java.util.List;

public record BookResponse(String slug, String title, String releaseDate,
                           String coverImgUrl, String seriesName,
                           List<String> authors, List<String> genres,
                           List<String> moods, List<String> tags) {

    public static BookResponse from(HardcoverResponse.Document doc) {
        return new BookResponse(
                doc.slug(),
                doc.title(),
                doc.release_date(),
                doc.coverUrl(),
                doc.seriesName(),
                doc.author_names(),
                doc.genres(),
                doc.moods(),
                doc.tags()
        );
    }
}

