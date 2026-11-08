package dev.polemaster.librorec.service;


import dev.polemaster.librorec.dto.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.List;
import java.util.Map;
import java.util.stream.Stream;

@Service
public class BookService {
    private static final Logger log = LoggerFactory.getLogger(BookService.class);

    private final RestClient hardcoverClient;
    private final RestClient openLibraryClient;

    public BookService(RestClient.Builder builder, @Value("${hardcover.app.api-key}") String hardcoverApiKey) {
        openLibraryClient = builder.clone()
            .baseUrl("https://openlibrary.org")
            .defaultHeader("User-Agent", "MyBookApp/1.0 (contact@example.com)")
            .build();

        String trimmedApiKey = hardcoverApiKey.trim();
        String authorizationKey = trimmedApiKey.startsWith("Bearer ") ? trimmedApiKey : "Bearer " + trimmedApiKey;

        hardcoverClient = builder.clone()
            .baseUrl("https://api.hardcover.app/v1/graphql")
            .defaultHeader("Authorization", authorizationKey)
            .defaultHeader("Content-Type", "application/json")
            .build();
    }

    public List<BookResponse> searchTopFiveBooks(String userQuery) {
        if (userQuery == null || userQuery.isBlank()) return List.of();

        try {
            HardcoverResponse response = searchHardcoverBooks(userQuery, 5);
            return streamValidHardcoverDocuments(response)
                    .limit(5)
                    .map(BookResponse::from)
                    .toList();
        } catch (RestClientException e) {
            log.warn("Hardcover API request failed for query '{}'. Falling back to OpenLibrary.", userQuery, e);
            try {
                OpenLibraryResponse response = searchOpenLibraryBooks(userQuery, 5);
                return streamValidOpenLibraryDocuments(response)
                        .limit(5)
                        .map(BookResponse::from)
                        .toList();
            } catch (RestClientException fallbackEx) {
                log.error("OpenLibrary fallback API also failed for query '{}'.", userQuery, fallbackEx);
                return List.of();
            }
        }
    }

    public RecommendationResponse searchBestMatchBook(String userQuery) {
        if (userQuery == null || userQuery.isBlank()) return null;

        try {
            HardcoverResponse response = searchHardcoverBooks(userQuery, 1);
            return streamValidHardcoverDocuments(response)
                    .map(RecommendationResponse::from)
                    .findFirst()
                    .orElse(null);
        } catch (RestClientException e) {
            log.warn("Hardcover API request failed for query '{}'. Falling back to OpenLibrary.", userQuery, e);
            try {
                OpenLibraryResponse response = searchOpenLibraryBooks(userQuery, 1);
                return streamValidOpenLibraryDocuments(response)
                        .map(RecommendationResponse::from)
                        .findFirst()
                        .orElse(null);
            } catch (RestClientException fallbackEx) {
                log.error("OpenLibrary fallback API also failed for query '{}'.", userQuery, fallbackEx);
                return null;
            }
        }
    }

    private Stream<HardcoverResponse.Document> streamValidHardcoverDocuments(HardcoverResponse response) {
        if (response == null || response.hits() == null) return Stream.empty();

        return response.hits().stream()
                .map(HardcoverResponse.Hit::document)
                .filter(doc -> doc != null && doc.slug() != null && doc.pages() != null && doc.pages() > 0);
    }

    private Stream<OpenLibraryResponse.Document> streamValidOpenLibraryDocuments(OpenLibraryResponse response) {
        if (response == null || response.docs() == null) return Stream.empty();

        return response.docs().stream()
                .filter(doc -> doc != null && doc.key() != null && !doc.key().isBlank());
    }


    private HardcoverResponse searchHardcoverBooks(String userQuery, int returnedBooksLimit) {
        String query = """
                query SearchBooks($searchTerm: String!, $limit: Int!){
                    search(query: $searchTerm, query_type: "Book", page: 1, per_page: $limit) {
                        results
                    }
                }
                """;
        Map<String, Object> variables = Map.of(
                "searchTerm", userQuery,
                "limit", returnedBooksLimit + 5
        );

        return hardcoverClient.post()
                .body(new GraphQlRequest(query, variables))
                .retrieve()
                .body(HardcoverResponse.class);
    }

    private OpenLibraryResponse searchOpenLibraryBooks(String userQuery, int returnedBooksLimit) {
        return openLibraryClient.get()
            .uri(uriBuilder -> uriBuilder
                    .path("/search.json")
                    .queryParam("q", userQuery)
                    .queryParam("fields", "key,title,author_name,first_publish_year,cover_i,subject")
                    .queryParam("limit", returnedBooksLimit + 5)
                    .build()
            )
            .retrieve()
            .body(OpenLibraryResponse.class);
    }
}
