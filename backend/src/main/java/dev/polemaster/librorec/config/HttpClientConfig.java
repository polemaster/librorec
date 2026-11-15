package dev.polemaster.librorec.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.ClientHttpRequestFactory;
import org.springframework.http.client.JdkClientHttpRequestFactory;

import java.net.http.HttpClient;

@Configuration
public class HttpClientConfig {

    @Bean
    public ClientHttpRequestFactory redirectingRequestFactory() {
        HttpClient httpClient = HttpClient.newBuilder()
                .followRedirects(HttpClient.Redirect.ALWAYS)
                .build();
        return new JdkClientHttpRequestFactory(httpClient);
    }
}
