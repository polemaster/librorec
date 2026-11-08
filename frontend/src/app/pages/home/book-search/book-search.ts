import { Component, OnDestroy, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  Subject,
  Subscription,
  catchError,
  debounceTime,
  distinctUntilChanged,
  of,
  switchMap,
} from 'rxjs';
import { BookService } from '../../../core/services/book.service';
import {
  Book,
  RecommendationMethod,
  RecommendationMethodOption,
} from '../../../core/models/book.model';
import { Icon } from '../../../shared/icon/icon';

export type { RecommendationMethod, RecommendationMethodOption };

@Component({
  selector: 'app-book-search',
  imports: [Icon, RouterLink],
  templateUrl: './book-search.html',
  styleUrl: './book-search.scss',
})
export class BookSearch implements OnDestroy {
  protected readonly bookService = inject(BookService);

  readonly searchQuery = signal('');
  readonly searchResults = signal<Book[]>([]);
  readonly isLoading = signal(false);
  readonly hasSearched = signal(false);
  readonly selectedBooksCount = this.bookService.selectedBooksCount;
  readonly loadedImages = signal<Set<string>>(new Set());
  readonly errorImages = signal<Set<string>>(new Set());

  private readonly searchSubject = new Subject<string>();
  private readonly subscription: Subscription;

  constructor() {
    this.subscription = this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((query) => {
          const trimmed = query.trim();
          if (!trimmed) {
            this.isLoading.set(false);
            this.hasSearched.set(false);
            this.updateResults([]);
            return [];
          }
          this.isLoading.set(true);
          return this.bookService.searchBooks(trimmed).pipe(catchError(() => of([])));
        }),
      )
      .subscribe({
        next: (books) => {
          this.updateResults(books);
          this.isLoading.set(false);
          this.hasSearched.set(true);
        },
        error: () => {
          this.updateResults([]);
          this.isLoading.set(false);
          this.hasSearched.set(true);
        },
      });
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  onQueryChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchQuery.set(value);
    this.searchSubject.next(value);
  }

  onGetRecommendations(): void {
    this.bookService.fetchRecommendations?.(this.bookService.selectedBooks());
  }

  onSearchSubmit(): void {
    const query = this.searchQuery().trim();
    if (!query) {
      return;
    }
    this.isLoading.set(true);
    this.bookService.searchBooks(query).subscribe({
      next: (books) => {
        this.updateResults(books);
        this.isLoading.set(false);
        this.hasSearched.set(true);
      },
      error: () => {
        this.updateResults([]);
        this.isLoading.set(false);
        this.hasSearched.set(true);
      },
    });
  }

  clearQuery(): void {
    this.searchQuery.set('');
    this.updateResults([]);
    this.hasSearched.set(false);
    this.isLoading.set(false);
  }

  toggleBook(book: Book): void {
    if (this.isBookSelected(book.id)) {
      this.bookService.removeBook(book.id);
    } else {
      this.bookService.addBook(book);
    }
  }

  onSelectBook(book: Book): void {
    this.bookService.addBook(book);
  }

  onRemoveBook(id: string): void {
    this.bookService.removeBook(id);
  }

  isBookSelected(id: string): boolean {
    return this.bookService.isBookSelected(id);
  }

  onImageLoad(id: string): void {
    this.loadedImages.update((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }

  onImageError(id: string): void {
    this.errorImages.update((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }

  isImageLoaded(id: string): boolean {
    return this.loadedImages().has(id);
  }

  isImageError(id: string): boolean {
    return this.errorImages().has(id);
  }

  formatAuthors(authors: string[] | null | undefined): string | null {
    if (!authors || authors.length === 0) {
      return null;
    }
    const filtered = authors.filter((a) => !!a && a.trim().length > 0);
    return filtered.length > 0 ? filtered.join(', ') : null;
  }

  getReleaseYear(releaseDate: string | null | undefined): string | null {
    if (!releaseDate) {
      return null;
    }
    const match = releaseDate.match(/\d{4}/);
    return match ? match[0] : releaseDate;
  }

  private updateResults(books: Book[]): void {
    const safeBooks = books ?? [];
    const currentIds = new Set(safeBooks.map((b) => b.id));
    this.loadedImages.update((prev) => new Set([...prev].filter((id) => currentIds.has(id))));
    this.errorImages.update((prev) => new Set([...prev].filter((id) => currentIds.has(id))));
    this.searchResults.set(safeBooks);
  }
}
