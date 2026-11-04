import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { BookService } from './book.service';
import { Book, RecommendationResponse } from '../models/book.model';

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

  const mockRecommendation: RecommendationResponse = {
    slug: 'rec-book-1',
    title: 'Recommended Book 1',
    releaseDate: '2021-01-15',
    coverImgUrl: 'https://example.com/rec1.jpg',
    seriesName: 'Rec Series',
    description: 'An exciting recommended book.',
    authors: ['Rec Author'],
    genres: ['Fiction'],
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

  it('should be created with empty selected books and GEMINI as default method', () => {
    expect(service).toBeTruthy();
    expect(service.selectedBooks()).toEqual([]);
    expect(service.selectedBooksCount()).toBe(0);
    expect(service.selectedMethod()).toBe('GEMINI');
    expect(service.recommendedBooks()).toEqual([]);
  });

  it('should update selected recommendation method', () => {
    service.setSelectedMethod('OPENROUTER');
    expect(service.selectedMethod()).toBe('OPENROUTER');
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

  it('should clear all selected books and reset recommendations state', () => {
    service.addBook(mockBook1);
    service.addBook(mockBook2);
    service.clearSelectedBooks();
    expect(service.selectedBooks()).toEqual([]);
    expect(service.selectedBooksCount()).toBe(0);
    expect(service.recommendedBooks()).toEqual([]);
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

  it('should return empty observable and make no HTTP call when getRecommendations is called with no books', () => {
    let results: RecommendationResponse[] | undefined;
    service.getRecommendations([]).subscribe((recs) => {
      results = recs;
    });

    expect(results).toEqual([]);
    httpTesting.expectNone('/api/recommendations?method=GEMINI');
  });

  it('should send HTTP POST request to /api/recommendations in BookRequest format with method param', () => {
    service.addBook(mockBook1);

    let results: RecommendationResponse[] | undefined;
    service.getRecommendations(service.selectedBooks(), 'OPENROUTER').subscribe((recs) => {
      results = recs;
    });

    const req = httpTesting.expectOne('/api/recommendations?method=OPENROUTER');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual([
      {
        slug: 'book-1',
        title: 'Test Book 1',
        releaseDate: '2020-05-10',
        authors: ['Author A'],
        genres: ['Fiction'],
        moods: ['adventurous'],
        tags: ['classic'],
      },
    ]);

    req.flush([mockRecommendation]);
    expect(results).toEqual([mockRecommendation]);
  });

  it('should store and remember recommended books in global state when fetchRecommendations is called', () => {
    service.addBook(mockBook1);
    service.fetchRecommendations(service.selectedBooks(), 'GEMINI');

    expect(service.isRecommendationsLoading()).toBe(true);

    const req = httpTesting.expectOne('/api/recommendations?method=GEMINI');
    expect(req.request.method).toBe('POST');
    req.flush([mockRecommendation]);

    expect(service.isRecommendationsLoading()).toBe(false);
    expect(service.hasLoadedRecommendations()).toBe(true);
    expect(service.recommendedBooks()).toEqual([mockRecommendation]);
    expect(service.recommendationsError()).toBeNull();
  });
});
