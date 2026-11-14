package dev.polemaster.librorec.service;

import dev.polemaster.librorec.dto.BookRequest;
import dev.polemaster.librorec.dto.BookSearchApi;
import dev.polemaster.librorec.dto.LLMResponse;
import dev.polemaster.librorec.dto.RecommendationMethod;
import dev.polemaster.librorec.dto.RecommendationResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import tools.jackson.databind.ObjectMapper;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
public class RecommendationService {

    private final ChatClient openAiClient;
    private final ChatClient geminiClient;
    private final ObjectMapper objectMapper;
    private final BookService bookService;

    public RecommendationService(
            @Qualifier("openAiChatClient") ChatClient openAiClient,
            @Qualifier("geminiChatClient") ChatClient geminiClient,
            ObjectMapper objectMapper,
            BookService bookService) {
        this.openAiClient = openAiClient;
        this.geminiClient = geminiClient;
        this.objectMapper = objectMapper;
        this.bookService = bookService;
    }

    public List<RecommendationResponse> getRecommendations(
            List<BookRequest> books,
            RecommendationMethod method,
            BookSearchApi api) {
        if (books.isEmpty()) return List.of();

        String booksText = objectMapper.writeValueAsString(books);
        String prompt = """
                Recommend me books based on these that I've enjoyed:
                %s

                Your answer should ONLY be 10 books in the following JSON format:
                [
                    {
                        "title": "Sherlock",
                        "authors": ["Arthur Conan Doyle"]
                    }
                ]
                """.formatted(booksText);
        LLMResponse response = generateAnswer(method, prompt);
        log.info("Prompting finished. Acquiring books metadata...");

        if (response.books().size() > 10)
            log.warn("LLM returned more than 10 books (" + response.books().size() + ")");

        List<RecommendationResponse> bookResponses = new ArrayList<>();
        for (LLMResponse.LLMBookResponse book: response.books()) {
            String author = (book.authors() != null && !book.authors().isEmpty() ) ? book.authors().getFirst() : "";
            String searchQuery = book.title() + " " + author;
            RecommendationResponse recommendationResponse = bookService.searchBestMatchBook(searchQuery, api);
            if (recommendationResponse != null)
                bookResponses.add(recommendationResponse);
        }
        log.info("Metadata collected. Finishing...");
        return bookResponses;
    }

    public LLMResponse generateAnswer(RecommendationMethod method, String prompt) {
        ChatClient chatClient = switch (method) {
            case GEMINI -> {
                log.info("Prompting Gemini...");
                yield geminiClient;
            }
            case OPENROUTER -> {
                log.info("Prompting OpenRouter...");
                yield openAiClient;
            }
        };

        return chatClient.prompt()
                .user(prompt)
                .call()
                .entity(LLMResponse.class);
    }
}
