import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Book } from '../models/book.model';

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
    this._selectedBooks.set([]);
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
}
