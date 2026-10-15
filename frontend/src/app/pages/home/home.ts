import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BookSearch } from './book-search/book-search';
import { BookService } from '../../core/services/book.service';
import { Icon } from '../../shared/icon/icon';

@Component({
  selector: 'app-home',
  imports: [BookSearch, RouterLink, Icon],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  protected readonly bookService = inject(BookService);

  readonly selectedBooks = this.bookService.selectedBooks;
  readonly selectedBooksCount = computed(() => this.bookService.selectedBooksCount());

  removeBook(id: string): void {
    this.bookService.removeBook(id);
  }

  clearAllBooks(): void {
    this.bookService.clearSelectedBooks();
  }
}
