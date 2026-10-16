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
    const selectedIds = new Set(selected.map((b) => b.id));

    if (selected.length === 0) return [];

    // Find genres and authors from selected books
    const selectedGenres = new Set(selected.map((b) => b.genre).filter((g): g is string => !!g));
    const selectedAuthors = new Set(selected.map((b) => b.author));

    // Recommend books matching same genre or author, followed by other popular books
    const matchingRecommendations = MOCK_BOOKS.filter(
      (b) =>
        !selectedIds.has(b.id) &&
        (selectedAuthors.has(b.author) || (b.genre && selectedGenres.has(b.genre))),
    );

    const otherRecommendations = MOCK_BOOKS.filter(
      (b) => !selectedIds.has(b.id) && !matchingRecommendations.some((m) => m.id === b.id),
    );

    return [...matchingRecommendations, ...otherRecommendations].slice(0, 6);
  });
}
