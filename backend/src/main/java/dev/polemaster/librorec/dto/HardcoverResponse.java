package dev.polemaster.librorec.dto;

import java.time.LocalDate;
import java.util.List;

public record HardcoverResponse(Data data) {
    public List<Hit> hits() {
        if (data == null || data.search() == null || data.search().results() == null || data.search().results().hits() == null) {
            return List.of();
        }
        return data.search().results().hits();
    }

    public record Data(Search search) {}
    public record Search(Results results) {}
    public record Results(int found, List<Hit> hits) {}
    public record Hit(Document document) {}
    public record Document(
            List<String> author_names,
            List<String> genres,
            Image image,
            List<String> moods,
            LocalDate release_date,
            String slug,
            List<String> tags,
            String title,
            Integer pages,
            FeaturedSeries featured_series,
            String description
    ) {
        public Document {
            author_names = (author_names != null) ? author_names : List.of();
            genres = (genres != null) ? genres : List.of();
            moods = (moods != null) ? moods : List.of();
            tags = (tags != null) ? tags : List.of();
            title = (title != null) ? title : "Unknown Title";
            pages = (pages != null) ? pages : 0;
        }

        public String coverUrl() {
            return (image != null) ? image.url() : null;
        }

        public String seriesName() {
            return (featured_series != null) ? (featured_series.series != null ? featured_series.series.name : null) : null;
        }

        public String releaseDate() {
            return release_date != null ? release_date.toString() : null;
        }
    }

    public record Image(String url) {}
    public record FeaturedSeries(Series series) {
        public record Series(String name) {}
    }

}
