import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, Subscription, of } from 'rxjs';
import {
  Book,
  BookRequest,
  RecommendationMethod,
  RecommendationResponse,
} from '../models/book.model';

@Injectable({
  providedIn: 'root',
})
export class BookService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/books';
  private readonly recommendationsApiUrl = '/api/recommendations';

  // Global state for books selected by the user
  private readonly _selectedBooks = signal<Book[]>([]);
  readonly selectedBooks = this._selectedBooks.asReadonly();
  readonly selectedBooksCount = computed(() => this._selectedBooks().length);

  // Global state for recommendations and selected method
  private readonly _selectedMethod = signal<RecommendationMethod>('GEMINI');
  readonly selectedMethod = this._selectedMethod.asReadonly();

  private readonly _recommendedBooks = signal<RecommendationResponse[]>([]);
  readonly recommendedBooks = this._recommendedBooks.asReadonly();

  private readonly _isRecommendationsLoading = signal(false);
  readonly isRecommendationsLoading = this._isRecommendationsLoading.asReadonly();

  private readonly _recommendationsError = signal<string | null>(null);
  readonly recommendationsError = this._recommendationsError.asReadonly();

  private readonly _hasLoadedRecommendations = signal(false);
  readonly hasLoadedRecommendations = this._hasLoadedRecommendations.asReadonly();

  private recommendationsSub?: Subscription;

  /**
   * Update the recommendation method in global state.
   */
  setSelectedMethod(method: RecommendationMethod): void {
    this._selectedMethod.set(method);
  }

  /**
   * Add a book with all backend metadata to the global selected books state.
   */
  addBook(book: Book): void {
    const current = this._selectedBooks();
    if (!current.some((b) => b.slug === book.slug)) {
      this._selectedBooks.set([...current, book]);
    }
  }

  /**
   * Remove a book from the global state by slug.
   */
  removeBook(slug: string): void {
    this._selectedBooks.set(this._selectedBooks().filter((b) => b.slug !== slug));
  }

  /**
   * Check if a book is already selected in the global state.
   */
  isBookSelected(slug: string): boolean {
    return this._selectedBooks().some((b) => b.slug === slug);
  }

  /**
   * Clear all selected books from global state.
   */
  clearSelectedBooks(): void {
    this.recommendationsSub?.unsubscribe();
    this._selectedBooks.set([]);
    this._recommendedBooks.set([]);
    this._isRecommendationsLoading.set(false);
    this._recommendationsError.set(null);
    this._hasLoadedRecommendations.set(false);
  }

  /**
   * Send search query to backend server.
   */
  searchBooks(query: string): Observable<Book[]> {
    const trimmed = query.trim();
    if (!trimmed) {
      return of([]);
    }

    const params = new HttpParams().set('query', trimmed);
    return this.http.get<Book[]>(`${this.apiUrl}/search`, { params });
  }

  /**
   * Convert a Book to BookRequest payload format expected by backend.
   */
  toBookRequest(book: Book | BookRequest): BookRequest {
    return {
      slug: book.slug,
      title: book.title,
      releaseDate: book.releaseDate ?? null,
      authors: book.authors ?? [],
      genres: book.genres ?? [],
      moods: book.moods ?? [],
      tags: book.tags ?? [],
    };
  }

  /**
   * Send POST request to /api/recommendations with selected books in BookRequest format.
   */
  getRecommendations(
    books: (Book | BookRequest)[] = this._selectedBooks(),
    method: RecommendationMethod = this._selectedMethod(),
  ): Observable<RecommendationResponse[]> {
    if (!books || books.length === 0) {
      return of([]);
    }

    const payload: BookRequest[] = books.map((book) => this.toBookRequest(book));
    const params = new HttpParams().set('method', method);
    return this.http.post<RecommendationResponse[]>(this.recommendationsApiUrl, payload, {
      params,
    });
  }

  /**
   * Explicitly trigger fetching recommendations and store them in global state.
   */
  fetchRecommendations(
    books: (Book | BookRequest)[] = this._selectedBooks(),
    method: RecommendationMethod = this._selectedMethod(),
  ): void {
    this._selectedMethod.set(method);
    if (!books || books.length === 0) {
      return;
    }

    this.recommendationsSub?.unsubscribe();
    this._isRecommendationsLoading.set(true);
    this._recommendationsError.set(null);

    this.recommendationsSub = this.getRecommendations(books, method).subscribe({
      next: (booksResponse) => {
        this._recommendedBooks.set(booksResponse ?? []);
        this._isRecommendationsLoading.set(false);
        this._hasLoadedRecommendations.set(true);
      },
      error: () => {
        this._recommendedBooks.set([]);
        this._recommendationsError.set('Failed to load recommendations. Please try again.');
        this._isRecommendationsLoading.set(false);
        this._hasLoadedRecommendations.set(true);
      },
    });
  }
}
