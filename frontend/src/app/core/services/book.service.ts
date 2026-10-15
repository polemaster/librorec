import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { Book } from '../models/book.model';
import { MOCK_BOOKS } from '../data/mock-books';

@Injectable({
  providedIn: 'root',
})
export class BookService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/books';

  // Global state for books selected by the user
  private readonly _selectedBooks = signal<Book[]>([]);
  readonly selectedBooks = this._selectedBooks.asReadonly();
  readonly selectedBooksCount = computed(() => this._selectedBooks().length);

  /**
   * Add a book to the global selected books state.
   */
  addBook(book: Book): void {
    const current = this._selectedBooks();
    if (!current.some((b) => b.id === book.id)) {
      this._selectedBooks.set([...current, book]);
    }
  }

  /**
   * Remove a book from the global state by id.
   */
  removeBook(bookId: string): void {
    this._selectedBooks.set(this._selectedBooks().filter((b) => b.id !== bookId));
  }

  /**
   * Check if a book is already selected in the global state.
   */
  isBookSelected(bookId: string): boolean {
    return this._selectedBooks().some((b) => b.id === bookId);
  }

  /**
   * Clear all selected books from global state.
   */
  clearSelectedBooks(): void {
    this._selectedBooks.set([]);
  }

  /**
   * Send search query to server with fallback to mock response.
   */
  searchBooks(query: string): Observable<Book[]> {
    const trimmed = query.trim();
    if (!trimmed) {
      return of([]);
    }

    const params = new HttpParams().set('q', trimmed);
    return this.http.get<Book[]>(`${this.apiUrl}/search`, { params }).pipe(
      catchError(() => {
        // Fallback to mock response when backend server is unavailable
        return of(this.getMockSearchResults(trimmed));
      })
    );
  }

  /**
   * Generate mock search results matching query on title, author, or genre.
   */
  getMockSearchResults(query: string): Book[] {
    const normalized = query.toLowerCase().trim();
    return MOCK_BOOKS.filter(
      (book) =>
        book.title.toLowerCase().includes(normalized) ||
        book.author.toLowerCase().includes(normalized) ||
        (book.genre && book.genre.toLowerCase().includes(normalized))
    );
  }
}
