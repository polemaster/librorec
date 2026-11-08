package dev.polemaster.librorec.service;

import dev.polemaster.librorec.dto.BookResponse;
import dev.polemaster.librorec.dto.BookSearchApi;
import dev.polemaster.librorec.dto.RecommendationResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.test.web.client.ResponseActions;
import org.springframework.web.client.RestClient;

import java.util.List;

import static org.hamcrest.Matchers.startsWith;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.*;
import static org.springframework.test.web.client.response.MockRestResponseCreators.*;

class BookServiceTest {
    private static final String QUERY = "way of kings";
    private static final String FIELDS = "key,title,author_name,first_publish_year,cover_i,subject";

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
        List<BookResponse> list = bookService.searchTopFiveBooks("", BookSearchApi.HARDCOVER);
        assertEquals(List.of(), list);
        mockServer.verify();
    }

    @Test
    void searchTopFiveBooksShouldReturnCorrectResponse() {
        String json = hardcoverResponseJson(VALID_BOOK_HIT);

        expectHardcoverRequest(QUERY, 10)
                .andRespond(withSuccess(json, MediaType.APPLICATION_JSON));

        List<BookResponse> list = bookService.searchTopFiveBooks(QUERY, BookSearchApi.HARDCOVER);

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

        List<BookResponse> list = bookService.searchTopFiveBooks(QUERY, BookSearchApi.HARDCOVER);

        assertEquals(1, list.size());
        assertEquals("The Way of Kings", list.getFirst().title());
        mockServer.verify();
    }

    @Test
    void searchTopFiveBooksShouldFallbackToOpenLibraryOnHardcoverError() {
        expectHardcoverRequest(QUERY, 10)
                .andRespond(withServerError());

        mockServer.expect(requestToUriTemplate("https://openlibrary.org/search.json?q={query}&fields={fields}&limit=10", QUERY, FIELDS))
                .andExpect(method(HttpMethod.GET))
                .andRespond(withSuccess());

        List<BookResponse> books = bookService.searchTopFiveBooks(QUERY, BookSearchApi.HARDCOVER);

        assertEquals(List.of(), books);
        mockServer.verify();
    }

    @Test
    void searchBestMatchBookShouldReturnNullOnEmptyQuery() {
        RecommendationResponse response = bookService.searchBestMatchBook("", BookSearchApi.HARDCOVER);
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

        RecommendationResponse response = bookService.searchBestMatchBook(QUERY, BookSearchApi.HARDCOVER);

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

        expectOpenLibraryRequest(QUERY, 6)
                .andRespond(withServerError());

        RecommendationResponse response = bookService.searchBestMatchBook(QUERY, BookSearchApi.HARDCOVER);

        assertNull(response);
        mockServer.verify();
    }

    @Test
    void searchTopFiveBooksShouldQueryOpenLibraryDirectlyWhenOpenLibraryApiSelected() {
        String openLibraryJson = """
                {
                  "docs": [
                    {
                      "key": "/works/OL15358691W",
                      "title": "The Way of Kings",
                      "author_name": ["Brandon Sanderson"],
                      "first_publish_year": "2010",
                      "cover_i": 12345,
                      "subject": ["series:The_Stormlight_Archive", "Fantasy", "Epic"]
                    }
                  ]
                }
                """;

        expectOpenLibraryRequest(QUERY, 10)
                .andRespond(withSuccess(openLibraryJson, MediaType.APPLICATION_JSON));

        List<BookResponse> list = bookService.searchTopFiveBooks(QUERY, BookSearchApi.OPENLIBRARY);

        BookResponse expected = new BookResponse(
                "OL15358691W",
                "The Way of Kings",
                "2010",
                "https://covers.openlibrary.org/b/id/12345-L.jpg",
                "The Stormlight Archive",
                List.of("Brandon Sanderson"),
                List.of(),
                List.of(),
                List.of("Fantasy", "Epic")
        );
        assertEquals(List.of(expected), list);
        mockServer.verify();
    }

    @Test
    void searchBestMatchBookShouldQueryOpenLibraryDirectlyWhenOpenLibraryApiSelected() {
        String openLibraryJson = """
                {
                  "docs": [
                    {
                      "key": "/works/OL15358691W",
                      "title": "The Way of Kings",
                      "author_name": ["Brandon Sanderson"],
                      "first_publish_year": "2010",
                      "cover_i": 12345,
                      "subject": ["series:The_Stormlight_Archive", "Fantasy", "Epic"]
                    }
                  ]
                }
                """;

        expectOpenLibraryRequest(QUERY, 6)
                .andRespond(withSuccess(openLibraryJson, MediaType.APPLICATION_JSON));

        RecommendationResponse response = bookService.searchBestMatchBook(QUERY, BookSearchApi.OPENLIBRARY);

        RecommendationResponse expected = new RecommendationResponse(
                "OL15358691W",
                "The Way of Kings",
                "2010",
                "https://covers.openlibrary.org/b/id/12345-L.jpg",
                "The Stormlight Archive",
                null,
                List.of("Brandon Sanderson"),
                List.of("Fantasy", "Epic")
        );
        assertEquals(expected, response);
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

    private ResponseActions expectOpenLibraryRequest(String query, int expectedLimit) {
        return mockServer.expect(requestToUriTemplate(
                        "https://openlibrary.org/search.json?q={q}&fields={fields}&limit={limit}",
                        query,
                        "key,title,author_name,first_publish_year,cover_i,subject",
                        expectedLimit))
                .andExpect(method(HttpMethod.GET))
                .andExpect(header("User-Agent", "MyBookApp/1.0 (contact@example.com)"));
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
