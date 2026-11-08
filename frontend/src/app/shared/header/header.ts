import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Icon } from '../icon/icon';
import { Dropdown } from '../dropdown/dropdown';
import { BookService } from '../../core/services/book.service';
import {
  BOOK_SEARCH_APIS,
  BookSearchApi,
  BookSearchApiOption,
  RECOMMENDATION_METHODS,
  RecommendationMethod,
  RecommendationMethodOption,
} from '../../core/models/book.model';

@Component({
  selector: 'app-header',
  imports: [Icon, Dropdown, RouterLink, RouterLinkActive],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  protected readonly bookService = inject(BookService);
  readonly selectedBooksCount = this.bookService.selectedBooksCount;

  readonly isSettingsOpen = signal(false);
  readonly recommendationMethods: RecommendationMethodOption[] = RECOMMENDATION_METHODS;
  readonly bookSearchApis: BookSearchApiOption[] = BOOK_SEARCH_APIS;

  private readonly localMethod = signal<RecommendationMethod>('GEMINI');
  private readonly localSearchApi = signal<BookSearchApi>('HARDCOVER');

  readonly selectedMethod = computed<RecommendationMethod>(() =>
    this.bookService.selectedMethod ? this.bookService.selectedMethod() : this.localMethod(),
  );

  readonly selectedSearchApi = computed<BookSearchApi>(() =>
    this.bookService.selectedSearchApi
      ? this.bookService.selectedSearchApi()
      : this.localSearchApi(),
  );

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.isSettingsOpen()) {
      this.closeSettings();
    }
  }

  openSettings(): void {
    this.isSettingsOpen.set(true);
  }

  closeSettings(): void {
    this.isSettingsOpen.set(false);
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closeSettings();
    }
  }

  onMethodSelect(value: RecommendationMethod): void {
    this.localMethod.set(value);
    this.bookService.setSelectedMethod?.(value);
  }

  onSearchApiSelect(value: BookSearchApi): void {
    this.localSearchApi.set(value);
    this.bookService.setSelectedSearchApi?.(value);
  }
}
