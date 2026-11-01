package dev.polemaster.librorec.controller;

import dev.polemaster.librorec.dto.BookResponse;
import dev.polemaster.librorec.service.BookService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/books")
public class BookController {
    private final BookService bookService;

    @GetMapping("/search")
    public List<BookResponse> searchBooks(@RequestParam String query) {
        return bookService.searchBooks(query);
    }
}
