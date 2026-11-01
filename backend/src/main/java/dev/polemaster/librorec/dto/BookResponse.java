package dev.polemaster.librorec.dto;

import java.time.LocalDate;

public record BookResponse(String title, String author, String genre, LocalDate releaseDate, String coverImgUrl) {
}

