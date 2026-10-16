import { Component } from '@angular/core';
import { BookSearch } from './book-search/book-search';

@Component({
  selector: 'app-home',
  imports: [BookSearch],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {}
