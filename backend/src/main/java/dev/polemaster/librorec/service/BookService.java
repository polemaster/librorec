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

    public List<BookResponse> searchBooks(String title, String author, String genre) {
        try {
            log.info("Trying primary provider: Hardcover...");
            return searchHardcoverBooks(title, author, genre);
        } catch (RestClientException e) {
            log.warn("Open Library failed ({}). Falling back to Open Library.", e.getMessage());
            return searchOpenLibraryBooks(title, author, genre);
        }
    }

    private List<BookResponse> searchHardcoverBooks(String title, String author, String genre) {
        String query = """
                query SearchBooks($searchTerm: String!){
                    search(query: $searchTerm, page: 1, per_page: 5) {
                        results
                    }
                }
                """;
        Map<String, Object> variables = Map.of(
                "searchTerm", title
        );

        HardcoverResponse response = hardcoverClient.post()
                .body(new GraphQlRequest(query, variables))
                .retrieve()
                .body(HardcoverResponse.class);


        HardcoverResponse.Document document = response.data().search().results().hits().getFirst().document();
        String responseTitle = document.title();
        String responseAuthor = document.author_names().getFirst();
        String responseGenre = document.genres().getFirst();
        LocalDate releaseDate = document.release_date();
        String coverImgUrl = document.image().url();
        return List.of(new BookResponse(responseTitle, responseAuthor, responseGenre, releaseDate, coverImgUrl));
    }

    private List<BookResponse> searchOpenLibraryBooks(String title, String author, String genre) {

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
