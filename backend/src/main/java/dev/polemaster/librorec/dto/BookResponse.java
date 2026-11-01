package dev.polemaster.librorec.dto;

import java.util.List;

public record BookResponse(String slug, String title, String author,
                           String releaseDate, String coverImgUrl,
                           List<String> genres, List<String> moods, List<String> tags) {
}

