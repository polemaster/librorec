package dev.polemaster.librorec.dto;

import java.time.LocalDate;
import java.util.List;

public record HardcoverResponse(Data data) {

    public record Data(Search search) {}
    public record Search(Results results) {}
    public record Results(int found, List<Hit> hits) {}
    public record Hit(Document document) {}
    public record Document(
            List<String> author_names,
            List<String> genres,
            LocalDate release_date,
            String title,
            Image image
    ) {}

    public record Image(String url) {}

}
