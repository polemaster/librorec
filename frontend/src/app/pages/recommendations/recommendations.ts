import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BookService } from '../../core/services/book.service';
import { Book } from '../../core/models/book.model';
import { MOCK_BOOKS } from '../../core/data/mock-books';
import { Icon } from '../../shared/icon/icon';

@Component({
  selector: 'app-recommendations',
  imports: [RouterLink, Icon],
  templateUrl: './recommendations.html',
  styleUrl: './recommendations.scss',
})
export class Recommendations {
  protected readonly bookService = inject(BookService);

  readonly selectedBooks = this.bookService.selectedBooks;
  readonly selectedBooksCount = this.bookService.selectedBooksCount;

  // Generates recommended books from the catalog that are not yet selected
  readonly recommendations = computed<Book[]>(() => {
    const selected = this.selectedBooks();
    const selectedSlugs = new Set(selected.map((b) => b.slug));

    if (selected.length === 0) return [];

    // Find genres and authors from selected books
    const selectedGenres = new Set(selected.flatMap((b) => b.genres ?? []));
    const selectedAuthors = new Set(selected.flatMap((b) => b.authors ?? []));

    // Recommend books matching same genre or author, followed by other popular books
    const matchingRecommendations = MOCK_BOOKS.filter(
      (b) =>
        !selectedSlugs.has(b.slug) &&
        ((b.authors && b.authors.some((a) => selectedAuthors.has(a))) ||
          (b.genres && b.genres.some((g) => selectedGenres.has(g)))),
    );

    const otherRecommendations = MOCK_BOOKS.filter(
      (b) => !selectedSlugs.has(b.slug) && !matchingRecommendations.some((m) => m.slug === b.slug),
    );

    return [...matchingRecommendations, ...otherRecommendations].slice(0, 6);
  });

  getReleaseYear(releaseDate: string | null | undefined): string | null {
    if (!releaseDate) {
      return null;
    }
    const match = releaseDate.match(/\d{4}/);
    return match ? match[0] : releaseDate;
  }
}
