package dev.polemaster.librorec.config;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.google.genai.GoogleGenAiChatModel;
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

@Configuration
public class AiConfig {
    private final String defaultSystemPrompt = "You are a helpful book recommendation expert.";

    @Primary
    @Bean
    public ChatClient geminiChatClient(GoogleGenAiChatModel model) {
        return ChatClient.builder(model)
                .defaultSystem(defaultSystemPrompt)
                .build();
    }

    @Bean
    public ChatClient openAiChatClient(OpenAiChatModel model) {
        return ChatClient.builder(model)
                .defaultSystem(defaultSystemPrompt)
                .build();
    }
}
