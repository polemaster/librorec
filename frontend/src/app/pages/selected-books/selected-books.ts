import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BookService } from '../../core/services/book.service';
import { Icon } from '../../shared/icon/icon';

@Component({
  selector: 'app-selected-books',
  imports: [RouterLink, Icon],
  templateUrl: './selected-books.html',
  styleUrl: './selected-books.scss',
})
export class SelectedBooks {
  protected readonly bookService = inject(BookService);

  readonly selectedBooks = this.bookService.selectedBooks;
  readonly selectedBooksCount = this.bookService.selectedBooksCount;

  removeBook(id: string): void {
    this.bookService.removeBook(id);
  }

  clearAllBooks(): void {
    this.bookService.clearSelectedBooks();
  }
}
