import { Component, HostListener, OnDestroy, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { BookService } from '../../core/services/book.service';
import {
  RECOMMENDATION_METHODS,
  RecommendationMethod,
  RecommendationMethodOption,
  RecommendationResponse,
} from '../../core/models/book.model';
import { Icon } from '../../shared/icon/icon';

export type RecommendationSort = 'recommended' | 'title' | 'author';
export type ViewMode = 'grid' | 'list';

export interface SortOption {
  value: RecommendationSort;
  label: string;
}

@Component({
  selector: 'app-recommendations',
  imports: [RouterLink, Icon],
  templateUrl: './recommendations.html',
  styleUrl: './recommendations.scss',
})
export class Recommendations implements OnDestroy {
  protected readonly bookService = inject(BookService);

  readonly selectedBooks = this.bookService.selectedBooks;
  readonly selectedBooksCount = this.bookService.selectedBooksCount;

  readonly recommendationMethods: RecommendationMethodOption[] = RECOMMENDATION_METHODS;
  readonly selectedMethod = signal<RecommendationMethod>(
    this.bookService.selectedMethod?.() ?? 'GEMINI',
  );

  readonly sortOptions: SortOption[] = [
    { value: 'recommended', label: 'Recommended' },
    { value: 'title', label: 'Title' },
    { value: 'author', label: 'Author' },
  ];
  readonly sortBy = signal<RecommendationSort>('recommended');
  readonly viewMode = signal<ViewMode>('grid');

  private readonly localRecommendations = signal<RecommendationResponse[]>([]);
  private readonly localIsLoading = signal(false);
  private readonly localHasLoaded = signal(false);
  private readonly localErrorMessage = signal<string | null>(null);

  readonly rawRecommendations = computed<RecommendationResponse[]>(() =>
    this.bookService.recommendedBooks
      ? this.bookService.recommendedBooks()
      : this.localRecommendations(),
  );
  readonly isLoading = computed<boolean>(() =>
    this.bookService.isRecommendationsLoading
      ? this.bookService.isRecommendationsLoading()
      : this.localIsLoading(),
  );
  readonly hasLoaded = computed<boolean>(() =>
    this.bookService.hasLoadedRecommendations
      ? this.bookService.hasLoadedRecommendations()
      : this.localHasLoaded(),
  );
  readonly errorMessage = computed<string | null>(() =>
    this.bookService.recommendationsError
      ? this.bookService.recommendationsError()
      : this.localErrorMessage(),
  );

  readonly activeBook = signal<RecommendationResponse | null>(null);
  readonly loadedImages = signal<Set<string>>(new Set());
  readonly errorImages = signal<Set<string>>(new Set());

  readonly recommendations = computed<RecommendationResponse[]>(() => {
    const books = this.rawRecommendations();
    const sort = this.sortBy();

    if (sort === 'title') {
      return [...books].sort((a, b) =>
        (a.title ?? '').localeCompare(b.title ?? '', undefined, { sensitivity: 'base' }),
      );
    }

    if (sort === 'author') {
      return [...books].sort((a, b) => {
        const authorA = a.authors?.[0]?.trim() ?? '';
        const authorB = b.authors?.[0]?.trim() ?? '';
        if (!authorA && !authorB) return 0;
        if (!authorA) return 1;
        if (!authorB) return -1;
        return authorA.localeCompare(authorB, undefined, { sensitivity: 'base' });
      });
    }

    return [...books];
  });

  private requestSub?: Subscription;

  ngOnDestroy(): void {
    this.requestSub?.unsubscribe();
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.activeBook()) {
      this.closeBookModal();
    }
  }

  loadRecommendations(): void {
    const books = this.selectedBooks();
    if (!books || books.length === 0) {
      return;
    }

    this.activeBook.set(null);
    this.loadedImages.set(new Set());
    this.errorImages.set(new Set());

    const method = this.selectedMethod();
    this.bookService.setSelectedMethod?.(method);

    if (this.bookService.fetchRecommendations) {
      this.bookService.fetchRecommendations(books, method);
      return;
    }

    this.requestSub?.unsubscribe();
    this.localIsLoading.set(true);
    this.localErrorMessage.set(null);

    const request$ = this.bookService.getRecommendations?.(books, method);
    if (!request$) {
      this.localIsLoading.set(false);
      return;
    }

    this.requestSub = request$.subscribe({
      next: (booksResponse) => {
        this.localRecommendations.set(booksResponse ?? []);
        this.localIsLoading.set(false);
        this.localHasLoaded.set(true);
      },
      error: () => {
        this.localRecommendations.set([]);
        this.localErrorMessage.set('Failed to load recommendations. Please try again.');
        this.localIsLoading.set(false);
        this.localHasLoaded.set(true);
      },
    });
  }

  onMethodChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as RecommendationMethod;
    this.selectedMethod.set(value);
    this.bookService.setSelectedMethod?.(value);
  }

  onSortChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as RecommendationSort;
    this.sortBy.set(value);
  }

  setViewMode(mode: ViewMode): void {
    this.viewMode.set(mode);
  }

  openBookModal(book: RecommendationResponse): void {
    this.activeBook.set(book);
  }

  closeBookModal(): void {
    this.activeBook.set(null);
  }

  getTopGenres(genres: string[] | null | undefined): string[] {
    return (genres ?? []).slice(0, 3);
  }

  getHardcoverUrl(slug: string): string {
    return `https://hardcover.app/books/${slug}`;
  }

  openBookPage(slug: string, event?: Event): void {
    event?.preventDefault();
    window.open(this.getHardcoverUrl(slug), '_blank', 'noopener,noreferrer');
  }

  onImageLoad(slug: string): void {
    this.loadedImages.update((prev) => {
      const next = new Set(prev);
      next.add(slug);
      return next;
    });
  }

  onImageError(slug: string): void {
    this.errorImages.update((prev) => {
      const next = new Set(prev);
      next.add(slug);
      return next;
    });
  }

  isImageLoaded(slug: string): boolean {
    return this.loadedImages().has(slug);
  }

  isImageError(slug: string): boolean {
    return this.errorImages().has(slug);
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
}
