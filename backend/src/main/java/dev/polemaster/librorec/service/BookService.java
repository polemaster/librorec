package dev.polemaster.librorec.service;


import dev.polemaster.librorec.dto.BookResponse;
import dev.polemaster.librorec.dto.GraphQlRequest;
import dev.polemaster.librorec.dto.HardcoverResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

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

    public List<BookResponse> searchBooks(String userQuery) {
        try {
            log.info("Trying primary provider: Hardcover...");
            return searchHardcoverBooks(userQuery);
        } catch (RestClientException e) {
            log.warn("Open Library failed ({}). Falling back to Open Library.", e.getMessage());
            return searchOpenLibraryBooks(userQuery);
        }
    }

    private List<BookResponse> searchHardcoverBooks(String userQuery) {
        String query = """
                query SearchBooks($searchTerm: String!){
                    search(query: $searchTerm, query_type: "book", page: 1, per_page: 5) {
                        results
                    }
                }
                """;
        Map<String, Object> variables = Map.of(
                "searchTerm", userQuery
        );

        HardcoverResponse response = hardcoverClient.post()
                .body(new GraphQlRequest(query, variables))
                .retrieve()
                .body(HardcoverResponse.class);

//        if (response.data()) return null;

        List<BookResponse> result = new ArrayList<>();
        List<HardcoverResponse.Hit> hits = response.data().search().results().hits();
        for (HardcoverResponse.Hit hit: hits) {
            HardcoverResponse.Document document = hit.document();
            String responseTitle = document.title();
//            String responseAuthor = document.author_names().getFirst();
            String responseAuthor = (document.author_names() != null && !document.author_names().isEmpty())
                    ? document.author_names().getFirst()
                    : "Unknown Author";
            List<String> genres = document.genres();
            String releaseDate = document.release_date();
//            String coverImgUrl = document.image().url();
            String coverImgUrl = (document.image() != null)
                    ? document.image().url()
                    : null;
            String slug = document.slug();
            List<String> moods = document.moods();
            List<String> tags = document.tags();

            result.add(new BookResponse(slug, responseTitle, responseAuthor, releaseDate, coverImgUrl, genres, moods, tags));
        }
        return result;
    }

    private List<BookResponse> searchOpenLibraryBooks(String userQuery) {

        String response = openLibraryClient.get()
            .uri(uriBuilder -> uriBuilder
                .queryParam("q")
                .build()
            )
            .retrieve()
            .body(String.class);

        log.info("Response: {}", response);
        return null;
    }
}
