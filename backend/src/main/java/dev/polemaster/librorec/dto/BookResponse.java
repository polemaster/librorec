package dev.polemaster.librorec.dto;

import java.util.List;

public record BookResponse(String slug, String title, String releaseDate,
                           String coverImgUrl, List<String> authors,
                           List<String> genres, List<String> moods, List<String> tags) {
}

