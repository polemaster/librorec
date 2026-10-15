import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { BookService } from './book.service';
import { Book } from '../models/book.model';

describe('BookService', () => {
  let service: BookService;
  let httpTesting: HttpTestingController;

  const mockBook1: Book = {
    id: 'b1',
    title: 'Test Book 1',
    author: 'Author A',
  };

  const mockBook2: Book = {
    id: 'b2',
    title: 'Test Book 2',
    author: 'Author B',
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

  it('should add a book to the global state', () => {
    service.addBook(mockBook1);
    expect(service.selectedBooks()).toEqual([mockBook1]);
    expect(service.selectedBooksCount()).toBe(1);
    expect(service.isBookSelected('b1')).toBe(true);
  });

  it('should not add duplicate books', () => {
    service.addBook(mockBook1);
    service.addBook(mockBook1);
    expect(service.selectedBooks().length).toBe(1);
    expect(service.selectedBooksCount()).toBe(1);
  });

  it('should remove a book by id', () => {
    service.addBook(mockBook1);
    service.addBook(mockBook2);
    expect(service.selectedBooksCount()).toBe(2);

    service.removeBook('b1');
    expect(service.selectedBooks()).toEqual([mockBook2]);
    expect(service.selectedBooksCount()).toBe(1);
    expect(service.isBookSelected('b1')).toBe(false);
    expect(service.isBookSelected('b2')).toBe(true);
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
    httpTesting.expectNone('/api/books/search?q=');
  });

  it('should send HTTP request when searching books and return server data', () => {
    let results: Book[] | undefined;
    service.searchBooks('1984').subscribe((books) => {
      results = books;
    });

    const req = httpTesting.expectOne('/api/books/search?q=1984');
    expect(req.request.method).toBe('GET');

    req.flush([mockBook1]);
    expect(results).toEqual([mockBook1]);
  });

  it('should fallback to mock response when server request fails', () => {
    let results: Book[] | undefined;
    service.searchBooks('Orwell').subscribe((books) => {
      results = books;
    });

    const req = httpTesting.expectOne('/api/books/search?q=Orwell');
    req.error(new ProgressEvent('Network error'));

    expect(results).toBeDefined();
    expect(results?.length).toBeGreaterThan(0);
    expect(results?.some((b) => b.author.includes('Orwell'))).toBe(true);
  });
});
