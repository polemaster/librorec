package dev.polemaster.librorec.dto.book;

import dev.polemaster.librorec.dto.external.HardcoverResponse;
import dev.polemaster.librorec.dto.external.OpenLibraryResponse;

import java.util.List;

public record BookResponse(String id, String title, String releaseDate,
                           String coverImgUrl, String seriesName,
                           List<String> authors, List<String> genres,
                           List<String> moods, List<String> tags) {

    public static BookResponse from(HardcoverResponse.Document doc) {
        return new BookResponse(
                doc.slug(),
                doc.title(),
                doc.releaseDate(),
                doc.coverUrl(),
                doc.seriesName(),
                doc.author_names(),
                doc.genres(),
                doc.moods(),
                doc.tags()
        );
    }


    public static BookResponse from(OpenLibraryResponse.Document doc) {
        return new BookResponse(
                doc.key(), // id
                doc.title(),
                doc.releaseYear(), // only year
                doc.coverUrl(),
                doc.seriesName(),
                doc.author_name(),
                List.of(), // genres
                List.of(), // moods
                doc.tags() // tags
        );
    }
}

