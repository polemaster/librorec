package dev.polemaster.librorec.dto.external;

import org.jspecify.annotations.NullMarked;
import org.jspecify.annotations.Nullable;

import java.time.LocalDate;
import java.util.List;

@NullMarked
public record GoodreadsBookData(
        // Work fields
        double averageRating,
        int ratingsCount,
        int totalReviewsCount,
        List<Integer> ratingsDistribution,
        @Nullable LocalDate firstPublicationDate,

        // Book fields
        List<String> authors,
        List<String> genres,
        String description,
        @Nullable Integer numberOfPages,
        @Nullable String seriesName,
        @Nullable String seriesPosition,

        // Reviews
        List<GoodreadsReview> reviews,

        // Goodreads link
        String goodreadsUrl
) {}
