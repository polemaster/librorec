import { Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { Subject, Subscription, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { BookService } from '../../../core/services/book.service';
import { Book } from '../../../core/models/book.model';
import { Icon } from '../../../shared/icon/icon';

@Component({
  selector: 'app-book-search',
  imports: [Icon],
  templateUrl: './book-search.html',
  styleUrl: './book-search.scss',
})
export class BookSearch implements OnDestroy {
  protected readonly bookService = inject(BookService);

  readonly searchQuery = signal('');
  readonly searchResults = signal<Book[]>([]);
  readonly isLoading = signal(false);
  readonly hasSearched = signal(false);
  readonly selectedBooksCount = computed(() => this.bookService.selectedBooksCount());

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
            this.searchResults.set([]);
            return [];
          }
          this.isLoading.set(true);
          return this.bookService.searchBooks(trimmed);
        })
      )
      .subscribe({
        next: (books) => {
          this.searchResults.set(books);
          this.isLoading.set(false);
          this.hasSearched.set(true);
        },
        error: () => {
          this.searchResults.set([]);
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

  onSearchSubmit(): void {
    const query = this.searchQuery().trim();
    if (!query) {
      return;
    }
    this.isLoading.set(true);
    this.bookService.searchBooks(query).subscribe({
      next: (books) => {
        this.searchResults.set(books);
        this.isLoading.set(false);
        this.hasSearched.set(true);
      },
      error: () => {
        this.searchResults.set([]);
        this.isLoading.set(false);
        this.hasSearched.set(true);
      },
    });
  }

  clearQuery(): void {
    this.searchQuery.set('');
    this.searchResults.set([]);
    this.hasSearched.set(false);
    this.isLoading.set(false);
  }

  onSelectBook(book: Book): void {
    this.bookService.addBook(book);
  }

  onRemoveBook(bookId: string): void {
    this.bookService.removeBook(bookId);
  }

  isBookSelected(bookId: string): boolean {
    return this.bookService.isBookSelected(bookId);
  }
}
