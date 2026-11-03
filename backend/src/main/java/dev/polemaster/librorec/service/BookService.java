package dev.polemaster.librorec.service;


import dev.polemaster.librorec.dto.BookResponse;
import dev.polemaster.librorec.dto.GraphQlRequest;
import dev.polemaster.librorec.dto.HardcoverResponse;
import dev.polemaster.librorec.dto.RecommendationResponse;
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
            .baseUrl("https://openlibrary.org/search.json")
            .build();

        String authorizationKey = hardcoverApiKey.startsWith("Bearer") ? hardcoverApiKey : "Bearer " + hardcoverApiKey;

        hardcoverClient = builder.clone()
            .baseUrl("https://api.hardcover.app/v1/graphql")
            .defaultHeader("Authorization", authorizationKey)
            .defaultHeader("Content-Type", "application/json")
            .build();


    }

    public List<BookResponse> searchTopFiveBooks(String userQuery) {
        try {
            HardcoverResponse response = searchHardcoverBooks(userQuery, 5);
            return streamValidDocuments(response)
                    .limit(5)
                    .map(BookResponse::from)
                    .toList();
        } catch (RestClientException e) {
            return searchOpenLibraryBooks(userQuery, 5);
        }
    }

    public RecommendationResponse searchBestMatchBook(String userQuery) {
        try {
            HardcoverResponse response = searchHardcoverBooks(userQuery, 1);
            return streamValidDocuments(response)
                    .map(RecommendationResponse::from)
                    .findFirst()
                    .orElse(null);
        } catch (RestClientException e) {
            return null;
        }
    }

    private Stream<HardcoverResponse.Document> streamValidDocuments(HardcoverResponse response) {
        if (response == null || response.hits() == null) return Stream.empty();

        return response.hits().stream()
                .map(HardcoverResponse.Hit::document)
                .filter(doc -> doc != null && doc.slug() != null && doc.pages() != null && doc.pages() > 0);
    }


    private HardcoverResponse searchHardcoverBooks(String userQuery, int returnedBooksLimit) {
        if (userQuery.isBlank()) return null;

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

    private List<BookResponse> searchOpenLibraryBooks(String userQuery, int returnedBooksLimit) {

        String response = openLibraryClient.get()
            .uri(uriBuilder -> uriBuilder
                .queryParam("q", userQuery)
                .build()
            )
            .retrieve()
            .body(String.class);

        log.info("Response: {}", response);
        return List.of();
    }
}
