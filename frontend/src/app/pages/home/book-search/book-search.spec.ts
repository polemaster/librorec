import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { BookSearch } from './book-search';
import { BookService } from '../../../core/services/book.service';
import { Book } from '../../../core/models/book.model';

describe('BookSearch', () => {
  let component: BookSearch;
  let fixture: ComponentFixture<BookSearch>;
  let bookService: BookService;

  const mockBooks: Book[] = [
    {
      id: '1984',
      title: '1984',
      releaseDate: '1949-06-08',
      coverImgUrl: 'https://assets.hardcover.app/cover-1984.jpg',
      authors: ['George Orwell'],
      genres: ['Dystopian Fiction'],
      moods: ['dark', 'tense'],
      tags: ['totalitarianism'],
    },
    {
      id: 'animal-farm',
      title: 'Animal Farm',
      releaseDate: null,
      coverImgUrl: null,
      authors: ['George Orwell', 'Second Author'],
      genres: ['Political Satire'],
      moods: [],
      tags: [],
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BookSearch],
      providers: [
        provideRouter([{ path: 'recommendations', children: [] }]),
        {
          provide: BookService,
          useValue: {
            selectedBooks: signal<Book[]>(mockBooks),
            selectedBooksCount: signal(2),
            selectedMethod: signal('GEMINI'),
            selectedSearchApi: signal('HARDCOVER'),
            setSelectedMethod: vi.fn(),
            setSelectedSearchApi: vi.fn(),
            fetchRecommendations: vi.fn(),
            addBook: vi.fn(),
            removeBook: vi.fn(),
            isBookSelected: vi.fn().mockReturnValue(false),
            searchBooks: vi.fn().mockReturnValue(of(mockBooks)),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BookSearch);
    component = fixture.componentInstance;
    bookService = TestBed.inject(BookService);
    await fixture.whenStable();
  });

  it('should create the search component', () => {
    expect(component).toBeTruthy();
  });

  it('should have a button pointing to recommendations and trigger fetchRecommendations when clicked', () => {
    fixture.detectChanges();
    const recBtn = fixture.nativeElement.querySelector('.search-box__submit-btn') as HTMLElement;
    expect(recBtn).toBeTruthy();
    expect(recBtn.getAttribute('routerlink')).toBe('/recommendations');
    expect(recBtn.textContent?.trim()).toBe('Recommendations');

    recBtn.click();
    expect(bookService.fetchRecommendations).toHaveBeenCalledWith(mockBooks);
  });

  it('should not render recommendation method dropdown inside search box', () => {
    fixture.detectChanges();
    const selectEl = fixture.nativeElement.querySelector('.search-box__method-select');
    expect(selectEl).toBeFalsy();
  });

  it('should search books on manual submit', () => {
    component.searchQuery.set('Orwell');
    component.onSearchSubmit();

    expect(bookService.searchBooks).toHaveBeenCalledWith('Orwell');
    expect(component.searchResults()).toEqual(mockBooks);
    expect(component.hasSearched()).toBe(true);
    expect(component.isLoading()).toBe(false);
  });

  it('should debounce search on input change', () => {
    vi.useFakeTimers();
    try {
      const inputEvent = {
        target: { value: 'Orwell' },
      } as unknown as Event;

      component.onQueryChange(inputEvent);
      expect(component.searchQuery()).toBe('Orwell');

      // Not called immediately
      expect(bookService.searchBooks).not.toHaveBeenCalled();

      // Advance 300ms debounce
      vi.advanceTimersByTime(300);

      expect(bookService.searchBooks).toHaveBeenCalledWith('Orwell');
      expect(component.searchResults()).toEqual(mockBooks);
    } finally {
      vi.useRealTimers();
    }
  });

  it('should render results directly beneath the search input and save full book data when clicked', () => {
    component.searchQuery.set('Orwell');
    component.onSearchSubmit();
    fixture.detectChanges();

    const searchField = fixture.nativeElement.querySelector('.search-box__field') as HTMLElement;
    const resultsList = searchField.querySelector('.results-list');
    expect(resultsList).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.search-results__heading')).toBeFalsy();

    const bookCards = searchField.querySelectorAll('.book-card');
    expect(bookCards.length).toBe(2);

    const firstCard = bookCards[0] as HTMLElement;
    expect(firstCard.querySelector('.book-card__title')?.textContent?.trim()).toBe('1984');
    expect(firstCard.querySelector('.book-card__author')?.textContent?.trim()).toBe(
      'by George Orwell',
    );
    expect(firstCard.querySelector('.book-card__pill')?.textContent?.trim()).toBe('1949');
    expect(firstCard.querySelector('.book-card__pill--genre')).toBeFalsy();
    expect(firstCard.querySelector('.book-card__description')).toBeFalsy();

    firstCard.click();
    expect(bookService.addBook).toHaveBeenCalledWith(mockBooks[0]);
  });

  it('should not display releaseDate or cover when they are null', () => {
    component.searchQuery.set('Orwell');
    component.onSearchSubmit();
    fixture.detectChanges();

    const bookCards = fixture.nativeElement.querySelectorAll('.book-card');
    const secondCard = bookCards[1] as HTMLElement;

    expect(secondCard.querySelector('.book-card__title')?.textContent?.trim()).toBe('Animal Farm');
    expect(secondCard.querySelector('.book-card__author')?.textContent?.trim()).toBe(
      'by George Orwell, Second Author',
    );
    expect(secondCard.querySelector('.book-card__pill')).toBeFalsy();
    expect(secondCard.querySelector('.book-card__cover')).toBeFalsy();
  });

  it('should display loading icon while cover image is loading and replace with image once loaded', () => {
    component.searchQuery.set('Orwell');
    component.onSearchSubmit();
    fixture.detectChanges();

    const firstCard = fixture.nativeElement.querySelectorAll('.book-card')[0] as HTMLElement;
    const coverWrapper = firstCard.querySelector('.book-card__cover') as HTMLElement;
    expect(coverWrapper).toBeTruthy();

    // Initially loading: spinner is present and image has loading class
    expect(coverWrapper.querySelector('.book-card__cover-spinner')).toBeTruthy();
    const coverImg = coverWrapper.querySelector('.book-card__cover-img') as HTMLImageElement;
    expect(coverImg).toBeTruthy();
    expect(coverImg.classList.contains('book-card__cover-img--loading')).toBe(true);

    // Simulate image load event
    coverImg.dispatchEvent(new Event('load'));
    fixture.detectChanges();

    expect(coverWrapper.querySelector('.book-card__cover-spinner')).toBeFalsy();
    expect(coverImg.classList.contains('book-card__cover-img--loading')).toBe(false);
  });

  it('should not display an "Add book" button on unselected books', () => {
    component.searchQuery.set('Orwell');
    component.onSearchSubmit();
    fixture.detectChanges();

    const addButton = fixture.nativeElement.querySelector('.btn--add');
    expect(addButton).toBeFalsy();
    const statusText = fixture.nativeElement.querySelector('.book-card__status');
    expect(statusText).toBeFalsy();
  });

  it('should display the text "Added" when book is selected and toggle removal on click', () => {
    vi.mocked(bookService.isBookSelected).mockImplementation((id) => id === '1984');

    component.searchQuery.set('Orwell');
    component.onSearchSubmit();
    fixture.detectChanges();

    const bookCards = fixture.nativeElement.querySelectorAll('.book-card');
    const firstCard = bookCards[0] as HTMLElement;
    const statusSpan = firstCard.querySelector('.book-card__status');
    expect(statusSpan).toBeTruthy();
    expect(statusSpan?.textContent?.trim()).toBe('Added');

    firstCard.click();
    expect(bookService.removeBook).toHaveBeenCalledWith('1984');
  });

  it('should show empty state when search returns no books', () => {
    vi.mocked(bookService.searchBooks).mockReturnValue(of([]));

    component.searchQuery.set('NonexistentBook');
    component.onSearchSubmit();
    fixture.detectChanges();

    const emptyMsg = fixture.nativeElement.querySelector('.search-feedback--empty');
    expect(emptyMsg?.textContent).toContain('No books found');
  });

  it('should clear query and reset state when clearQuery is called', () => {
    component.searchQuery.set('Orwell');
    component.searchResults.set(mockBooks);
    component.hasSearched.set(true);

    component.clearQuery();

    expect(component.searchQuery()).toBe('');
    expect(component.searchResults()).toEqual([]);
    expect(component.hasSearched()).toBe(false);
  });

  it('should render the clear button and clear search on click', () => {
    component.searchQuery.set('Orwell');
    fixture.detectChanges();

    const clearButton = fixture.nativeElement.querySelector(
      '.search-box__clear',
    ) as HTMLButtonElement;
    expect(clearButton).toBeTruthy();

    clearButton.click();
    expect(component.searchQuery()).toBe('');
  });
});
