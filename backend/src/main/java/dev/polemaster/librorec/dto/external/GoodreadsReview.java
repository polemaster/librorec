package dev.polemaster.librorec.dto.external;

import org.jspecify.annotations.NullMarked;

@NullMarked
public record GoodreadsReview(
        int rating,
        int likeCount
) {}
