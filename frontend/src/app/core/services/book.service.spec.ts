import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { BookService } from './book.service';
import { Book } from '../models/book.model';

describe('BookService', () => {
  let service: BookService;
  let httpTesting: HttpTestingController;

  const mockBook1: Book = {
    slug: 'book-1',
    title: 'Test Book 1',
    releaseDate: '2020-05-10',
    coverImgUrl: 'https://example.com/cover1.jpg',
    authors: ['Author A'],
    genres: ['Fiction'],
    moods: ['adventurous'],
    tags: ['classic'],
  };

  const mockBook2: Book = {
    slug: 'book-2',
    title: 'Test Book 2',
    releaseDate: null,
    coverImgUrl: null,
    authors: ['Author B', 'Author C'],
    genres: ['Sci-Fi'],
    moods: ['tense'],
    tags: ['space'],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        BookService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(BookService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should be created with empty selected books', () => {
    expect(service).toBeTruthy();
    expect(service.selectedBooks()).toEqual([]);
    expect(service.selectedBooksCount()).toBe(0);
  });

  it('should add a book with all backend data to the global state', () => {
    service.addBook(mockBook1);
    expect(service.selectedBooks()).toEqual([mockBook1]);
    expect(service.selectedBooksCount()).toBe(1);
    expect(service.isBookSelected('book-1')).toBe(true);
  });

  it('should not add duplicate books with the same slug', () => {
    service.addBook(mockBook1);
    service.addBook(mockBook1);
    expect(service.selectedBooks().length).toBe(1);
    expect(service.selectedBooksCount()).toBe(1);
  });

  it('should remove a book by slug', () => {
    service.addBook(mockBook1);
    service.addBook(mockBook2);
    expect(service.selectedBooksCount()).toBe(2);

    service.removeBook('book-1');
    expect(service.selectedBooks()).toEqual([mockBook2]);
    expect(service.selectedBooksCount()).toBe(1);
    expect(service.isBookSelected('book-1')).toBe(false);
    expect(service.isBookSelected('book-2')).toBe(true);
  });

  it('should clear all selected books', () => {
    service.addBook(mockBook1);
    service.addBook(mockBook2);
    service.clearSelectedBooks();
    expect(service.selectedBooks()).toEqual([]);
    expect(service.selectedBooksCount()).toBe(0);
  });

  it('should return empty observable when search query is whitespace or empty', () => {
    let results: Book[] | undefined;
    service.searchBooks('   ').subscribe((books) => {
      results = books;
    });

    expect(results).toEqual([]);
    httpTesting.expectNone('/api/books/search?query=');
  });

  it('should send HTTP GET request to /api/books/search with query param and return backend data', () => {
    let results: Book[] | undefined;
    service.searchBooks('1984').subscribe((books) => {
      results = books;
    });

    const req = httpTesting.expectOne('/api/books/search?query=1984');
    expect(req.request.method).toBe('GET');

    req.flush([mockBook1]);
    expect(results).toEqual([mockBook1]);
  });

  it('should propagate error and not fallback to mock data when server request fails', () => {
    let errorReceived = false;
    service.searchBooks('Orwell').subscribe({
      error: () => {
        errorReceived = true;
      },
    });

    const req = httpTesting.expectOne('/api/books/search?query=Orwell');
    req.error(new ProgressEvent('Network error'));

    expect(errorReceived).toBe(true);
  });
});
