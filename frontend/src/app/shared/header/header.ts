import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Icon } from '../icon/icon';
import { BookService } from '../../core/services/book.service';

@Component({
  selector: 'app-header',
  imports: [Icon, RouterLink, RouterLinkActive],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  protected readonly bookService = inject(BookService);
  readonly selectedBooksCount = this.bookService.selectedBooksCount;
}
