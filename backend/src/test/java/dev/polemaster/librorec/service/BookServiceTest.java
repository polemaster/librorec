package dev.polemaster.librorec.service;

import dev.polemaster.librorec.dto.BookResponse;
import dev.polemaster.librorec.dto.RecommendationResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.test.web.client.ResponseActions;
import org.springframework.web.client.RestClient;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.*;
import static org.springframework.test.web.client.response.MockRestResponseCreators.*;

class BookServiceTest {
    private static final String QUERY = "way of kings";

    private static final String VALID_BOOK_HIT = """
            {
              "document": {
                "author_names": ["Brandon Sanderson"],
                "description": "Short description.",
                "featured_series": { "series": { "name": "The Stormlight Archive" } },
                "genres": ["Fantasy", "Epic"],
                "image": { "url": "https://example.com/cover.jpg" },
                "moods": ["Adventurous", "dark"],
                "pages": 1007,
                "release_date": "2010-01-01",
                "slug": "the-way-of-kings",
                "tags": ["Plot driven", "fantasy"],
                "title": "The Way of Kings"
              }
            }
            """;

    private MockRestServiceServer mockServer;
    private BookService bookService;

    @BeforeEach
    void setUp() {
        RestClient.Builder builder = RestClient.builder();
        mockServer = MockRestServiceServer.bindTo(builder).build();
        bookService = new BookService(builder, "test-api-key");
    }

    @Test
    void searchTopFiveBooksShouldReturnEmptyListOnEmptyQuery() {
        List<BookResponse> list = bookService.searchTopFiveBooks("");
        assertEquals(List.of(), list);
        mockServer.verify();
    }

    @Test
    void searchTopFiveBooksShouldReturnCorrectResponse() {
        String json = hardcoverResponseJson(VALID_BOOK_HIT);

        expectHardcoverRequest(QUERY, 10)
                .andRespond(withSuccess(json, MediaType.APPLICATION_JSON));

        List<BookResponse> list = bookService.searchTopFiveBooks(QUERY);

        BookResponse expected = new BookResponse(
                "the-way-of-kings",
                "The Way of Kings",
                "2010-01-01",
                "https://example.com/cover.jpg",
                "The Stormlight Archive",
                List.of("Brandon Sanderson"),
                List.of("Fantasy", "Epic"),
                List.of("Adventurous", "dark"),
                List.of("Plot driven", "fantasy")
        );
        assertEquals(List.of(expected), list);
        mockServer.verify();
    }

    @Test
    void searchTopFiveBooksShouldFilterOutBooksWithoutSlugOrPages() {
        String hits = """
                %s,
                { "document": { "title": "Words of Radiance", "slug": "words-of-radiance" } },
                { "document": { "title": "Oathbringer", "pages": 1007 } }
                """.formatted(VALID_BOOK_HIT);

        expectHardcoverRequest(QUERY, 10)
                .andRespond(withSuccess(hardcoverResponseJson(hits), MediaType.APPLICATION_JSON));

        List<BookResponse> list = bookService.searchTopFiveBooks(QUERY);

        assertEquals(1, list.size());
        assertEquals("The Way of Kings", list.getFirst().title());
        mockServer.verify();
    }

    @Test
    void searchTopFiveBooksShouldFallbackToOpenLibraryOnHardcoverError() {
        expectHardcoverRequest(QUERY, 10)
                .andRespond(withServerError());

        mockServer.expect(requestToUriTemplate("https://openlibrary.org/search.json?q={query}", QUERY))
                .andExpect(method(HttpMethod.GET))
                .andRespond(withSuccess());

        List<BookResponse> books = bookService.searchTopFiveBooks(QUERY);

        assertEquals(List.of(), books);
        mockServer.verify();
    }

    @Test
    void searchBestMatchBookShouldReturnNullOnEmptyQuery() {
        RecommendationResponse response = bookService.searchBestMatchBook("");
        assertNull(response);
        mockServer.verify();
    }

    @Test
    void searchBestMatchBookShouldReturnFirstValidMatch() {
        String hits = """
                { "document": { "title": "Words of Radiance", "slug": "words-of-radiance" } },
                %s
                """.formatted(VALID_BOOK_HIT);

        expectHardcoverRequest(QUERY, 6)
                .andRespond(withSuccess(hardcoverResponseJson(hits), MediaType.APPLICATION_JSON));

        RecommendationResponse response = bookService.searchBestMatchBook(QUERY);

        RecommendationResponse expected = new RecommendationResponse(
                "the-way-of-kings",
                "The Way of Kings",
                "2010-01-01",
                "https://example.com/cover.jpg",
                "The Stormlight Archive",
                "Short description.",
                List.of("Brandon Sanderson"),
                List.of("Fantasy", "Epic")
        );
        assertEquals(expected, response);
        mockServer.verify();
    }

    @Test
    void searchBestMatchBookShouldReturnNullOnHardcoverError() {
        expectHardcoverRequest(QUERY, 6)
                .andRespond(withServerError());

        RecommendationResponse response = bookService.searchBestMatchBook(QUERY);

        assertNull(response);
        mockServer.verify();
    }

    private ResponseActions expectHardcoverRequest(String query, int expectedLimit) {
        return mockServer.expect(requestTo("https://api.hardcover.app/v1/graphql"))
                .andExpect(method(HttpMethod.POST))
                .andExpect(header("Authorization", "Bearer test-api-key"))
                .andExpect(header("Content-Type", "application/json"))
                .andExpect(jsonPath("$.variables.searchTerm").value(query))
                .andExpect(jsonPath("$.variables.limit").value(expectedLimit));
    }

    private static String hardcoverResponseJson(String hitsJson) {
        return """
                {
                  "data": {
                    "search": {
                      "results": {
                        "found": 1,
                        "hits": [ %s ]
                      }
                    }
                  }
                }
                """.formatted(hitsJson);
    }
}
