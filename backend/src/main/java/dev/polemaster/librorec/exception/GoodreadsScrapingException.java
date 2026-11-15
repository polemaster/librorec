package dev.polemaster.librorec.exception;

import lombok.Getter;
import org.jspecify.annotations.NullMarked;
import org.jspecify.annotations.Nullable;

@NullMarked
@Getter
public class GoodreadsScrapingException extends RuntimeException {

    private final String isbn;

    public GoodreadsScrapingException(String isbn, String message) {
        super(message);
        this.isbn = isbn;
    }

    public GoodreadsScrapingException(String isbn, String message, @Nullable Throwable cause) {
        super(message, cause);
        this.isbn = isbn;
    }
}
