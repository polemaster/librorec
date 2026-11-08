package dev.polemaster.librorec.dto;

import java.util.List;

public record OpenLibraryResponse(List<Document> docs) {
    public record Document(
            String key,
            String title,
            List<String> author_name,
            String first_publish_year,
            Integer cover_i,
            List<String> subject
    ) {
        public Document {
            key = key != null ? key.replace("/works/", "") : null;
            author_name = (author_name != null) ? author_name : List.of();
        }

        public String coverUrl() {
            return cover_i != null ? "https://covers.openlibrary.org/b/id/%s-L.jpg".formatted(cover_i) : null;
        }

        public String seriesName() {
            if (subject == null) return null;
            return subject.stream()
                    .filter(s -> s.toLowerCase().startsWith("series:"))
                    .map(s -> s.substring(7).replace("_", " ").trim())
                    .findFirst()
                    .orElse(null);
        }

        public List<String> tags() {
            if (subject == null) return List.of();
            return subject.stream()
                    .filter(s -> !s.toLowerCase().startsWith("series:"))
                    .filter(s -> !s.toLowerCase().startsWith("nyt:"))
                    .limit(10)
                    .toList();
        }
    }
}
