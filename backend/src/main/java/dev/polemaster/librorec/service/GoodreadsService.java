package dev.polemaster.librorec.service;

import dev.polemaster.librorec.dto.external.GoodreadsBookData;
import dev.polemaster.librorec.dto.external.GoodreadsReview;
import dev.polemaster.librorec.exception.GoodreadsScrapingException;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jspecify.annotations.NullMarked;
import org.jspecify.annotations.Nullable;
import org.springframework.http.client.ClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;
import tools.jackson.databind.node.MissingNode;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

@Service
@NullMarked
public class GoodreadsService {

    private final RestClient restClient;
    private final JsonMapper jsonMapper;

    public GoodreadsService(RestClient.Builder builder, ClientHttpRequestFactory requestFactory, JsonMapper jsonMapper) {
        this.jsonMapper = jsonMapper;
        this.restClient = builder
                .requestFactory(requestFactory)
                .baseUrl("https://www.goodreads.com")
                .defaultHeader("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36")
                .defaultHeader("Accept-Language", "en-US,en;q=0.9")
                .build();
    }

    public GoodreadsBookData getGoodreadsData(String isbn) {
        JsonNode apolloState = fetchApolloState(isbn);

        JsonNode workNode = findWorkNode(apolloState, isbn);
        JsonNode bookNode = findMainBookNode(apolloState, isbn);
        JsonNode statsNode = workNode.path("stats");
        JsonNode seriesEntry = bookNode.path("bookSeries").path(0);

        return new GoodreadsBookData(
                // Work data
                statsNode.path("averageRating").asDouble(0.0),
                statsNode.path("ratingsCount").asInt(0),
                statsNode.path("textReviewsCount").asInt(0),
                extractRatingsDistribution(statsNode.path("ratingsCountDist")),
                extractPublicationDate(workNode.path("details").path("publicationTime")),

                // Book data
                extractAuthors(bookNode, apolloState),
                extractGenres(bookNode.path("bookGenres")),
                extractDescription(bookNode),
                extractPageCount(bookNode.path("details").path("numPages")),
                extractSeriesName(seriesEntry, apolloState),
                extractSeriesPosition(seriesEntry),

                // Reviews
                extractReviews(apolloState),

                // Goodreads Link
                bookNode.path("webUrl").asString("https://www.goodreads.com/book/isbn/" + isbn)
        );
    }

    private JsonNode fetchApolloState(String isbn) {
        String html = restClient.get()
                .uri("/book/isbn/{isbn}", isbn)
                .retrieve()
                .body(String.class);

        if (html == null || html.isBlank()) {
            throw new GoodreadsScrapingException(isbn, "Received empty HTML body from Goodreads.");
        }

        Document doc = Jsoup.parse(html);
        Element nextDataScript = doc.selectFirst("script#__NEXT_DATA__");
        if (nextDataScript == null) {
            throw new GoodreadsScrapingException(isbn, "Could not find __NEXT_DATA__ script on Goodreads page.");
        }

        try {
            JsonNode root = jsonMapper.readTree(nextDataScript.data());
            JsonNode apolloState = root.path("props").path("pageProps").path("apolloState");
            if (apolloState.isMissingNode() || apolloState.isNull()) {
                throw new GoodreadsScrapingException(isbn, "Missing apolloState node inside Goodreads __NEXT_DATA__ payload.");
            }
            return apolloState;
        } catch (JacksonException ex) {
            throw new GoodreadsScrapingException(isbn, "Failed to parse __NEXT_DATA__ JSON payload from Goodreads.", ex);
        }
    }

    private JsonNode findWorkNode(JsonNode apolloState, String isbn) {
        for (Map.Entry<String, JsonNode> entry : apolloState.properties()) {
            if (entry.getKey().startsWith("Work:") && entry.getValue().has("stats")) {
                return entry.getValue();
            }
        }
        throw new GoodreadsScrapingException(isbn, "Could not find Work node in Goodreads apolloState.");
    }

    private JsonNode findMainBookNode(JsonNode apolloState, String isbn) {
        // The active edition's Book node has "details" or "bookGenres" (unlike stub Book nodes for other editions)
        for (Map.Entry<String, JsonNode> entry : apolloState.properties()) {
            JsonNode node = entry.getValue();
            if (entry.getKey().startsWith("Book:") && (node.has("details") || node.has("bookGenres"))) {
                return node;
            }
        }
        return MissingNode.getInstance();
    }

    private List<Integer> extractRatingsDistribution(JsonNode distNode) {
        if (!distNode.isArray()) {
            return List.of();
        }
        List<Integer> distribution = new ArrayList<>(distNode.size());
        for (JsonNode count : distNode) {
            distribution.add(count.asInt(0));
        }
        return distribution;
    }

    private @Nullable LocalDate extractPublicationDate(JsonNode pubTimeNode) {
        if (pubTimeNode.isMissingNode() || pubTimeNode.isNull()) {
            return null;
        }
        // Goodreads stores publicationTime in epoch milliseconds (can be negative for pre-1970 books)
        long epochMillis = pubTimeNode.asLong();
        return Instant.ofEpochMilli(epochMillis).atZone(ZoneOffset.UTC).toLocalDate();
    }

    private List<String> extractAuthors(JsonNode bookNode, JsonNode apolloState) {
        List<String> authors = new ArrayList<>();

        // 1. Primary author
        String primaryRef = bookNode.path("primaryContributorEdge").path("node").path("__ref").asString("");
        if (!primaryRef.isEmpty()) {
            String primaryName = apolloState.path(primaryRef).path("name").asString("");
            if (!primaryName.isEmpty()) {
                authors.add(primaryName);
            }
        }

        // 2. Secondary contributors (only keep "Author" or "Co-Author" roles if you want to skip translators/illustrators)
        for (JsonNode edge : bookNode.path("secondaryContributorEdges")) {
            String role = edge.path("role").asString("");
            if ("Author".equalsIgnoreCase(role)) {
                String ref = edge.path("node").path("__ref").asString("");
                String name = apolloState.path(ref).path("name").asString("");
                if (!name.isEmpty()) {
                    authors.add(name);
                }
            }
        }
        return authors;
    }

    private List<String> extractGenres(JsonNode bookGenresNode) {
        List<String> genres = new ArrayList<>();
        for (JsonNode genreWrapper : bookGenresNode) {
            String genreName = genreWrapper.path("genre").path("name").asString("");
            if (!genreName.isEmpty()) {
                genres.add(genreName);
            }
        }
        return genres;
    }

    private String extractDescription(JsonNode bookNode) {
        // Prefer stripped plain-text description if present, otherwise strip HTML from "description"
        String stripped = bookNode.path("description({\"stripped\":true})").asString("");
        if (!stripped.isEmpty()) {
            return stripped;
        }
        String rawHtml = bookNode.path("description").asString("");
        return rawHtml.isEmpty() ? "" : Jsoup.parse(rawHtml).text();
    }

    private @Nullable Integer extractPageCount(JsonNode numPagesNode) {
        return (numPagesNode.isNumber() && numPagesNode.asInt() > 0) ? numPagesNode.asInt() : null;
    }

    private @Nullable String extractSeriesName(JsonNode seriesEntry, JsonNode apolloState) {
        if (seriesEntry.isMissingNode()) {
            return null;
        }
        String seriesRef = seriesEntry.path("series").path("__ref").asString("");
        String title = apolloState.path(seriesRef).path("title").asString("");
        return title.isEmpty() ? null : title;
    }

    private @Nullable String extractSeriesPosition(JsonNode seriesEntry) {
        if (seriesEntry.isMissingNode()) {
            return null;
        }
        String pos = seriesEntry.path("userPosition").asString("");
        return pos.isEmpty() ? null : pos;
    }

    private List<GoodreadsReview> extractReviews(JsonNode apolloState) {
        List<GoodreadsReview> reviews = new ArrayList<>();
        for (Map.Entry<String, JsonNode> entry : apolloState.properties()) {
            if (entry.getKey().startsWith("Review:")) {
                JsonNode reviewNode = entry.getValue();
                int rating = reviewNode.path("rating").asInt(0);
                if (rating > 0) {
                    int likes = reviewNode.path("likeCount").asInt(0);
                    reviews.add(new GoodreadsReview(rating, likes));
                }
            }
        }
        reviews.sort(Comparator.comparingInt(GoodreadsReview::likeCount).reversed());
        return reviews;
    }
}
