package dev.polemaster.librorec.service;

import dev.polemaster.librorec.dto.BookRequest;
import dev.polemaster.librorec.dto.LLMResponse;
import dev.polemaster.librorec.dto.RecommendationResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import tools.jackson.databind.ObjectMapper;

import java.util.ArrayList;
import java.util.List;

@Service
public class RecommendationService {
    private static final Logger log = LoggerFactory.getLogger(RecommendationService.class);

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

    public List<RecommendationResponse> getRecommendations(List<BookRequest> books) {
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
        LLMResponse response = generateAnswer("gemini", prompt);
        log.info("Prompting finished. Acquiring books metadata...");

        if (response.books().size() > 10)
            log.warn("LLM returned more than 10 books (" + response.books().size() + ")");

        List<RecommendationResponse> bookResponses = new ArrayList<>();
        for (LLMResponse.LLMBookResponse book: response.books()) {
            String hardcoverQuery = book.title() + " " + book.authors().getFirst();
            RecommendationResponse recommendationResponse = bookService.searchBestMatchBook(hardcoverQuery);
            if (recommendationResponse != null)
                bookResponses.add(recommendationResponse);
        }
        log.info("Metadata collected. Finishing...");
        return bookResponses;
    }

    public LLMResponse generateAnswer(String client, String prompt) {
        if (client.equals("gemini")) {
            log.info("Prompting Gemini...");
            return geminiClient.prompt()
                    .user(prompt)
                    .call()
                    .entity(LLMResponse.class);
        } else if (client.equals("openAI")) {
            log.info("Prompting OpenAI...");
            return openAiClient.prompt()
                    .user(prompt)
                    .call()
                    .entity(LLMResponse.class);
        }
        return null;
    }
}
