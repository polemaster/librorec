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
      id: '1',
      title: '1984',
      author: 'George Orwell',
      year: 1949,
      genre: 'Dystopian Fiction',
      description: 'A chilling story of totalitarianism.',
    },
    {
      id: '2',
      title: 'Animal Farm',
      author: 'George Orwell',
      year: 1945,
      genre: 'Political Satire',
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BookSearch],
      providers: [
        provideRouter([]),
        {
          provide: BookService,
          useValue: {
            selectedBooks: signal<Book[]>([]),
            selectedBooksCount: signal(0),
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

  it('should have a button pointing to recommendations', () => {
    fixture.detectChanges();
    const recBtn = fixture.nativeElement.querySelector('.search-box__submit-btn');
    expect(recBtn).toBeTruthy();
    expect(recBtn.getAttribute('routerlink')).toBe('/recommendations');
    expect(recBtn.textContent?.trim()).toBe('Recommendations');
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

  it('should render search results and add book when the entire line/rectangle is clicked', () => {
    component.searchQuery.set('Orwell');
    component.onSearchSubmit();
    fixture.detectChanges();

    const bookCards = fixture.nativeElement.querySelectorAll('.book-card');
    expect(bookCards.length).toBe(2);

    const firstCard = bookCards[0] as HTMLElement;
    expect(firstCard.querySelector('.book-card__title')?.textContent?.trim()).toBe('1984');

    firstCard.click();
    expect(bookService.addBook).toHaveBeenCalledWith(mockBooks[0]);
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
    vi.mocked(bookService.isBookSelected).mockImplementation((id) => id === '1');

    component.searchQuery.set('Orwell');
    component.onSearchSubmit();
    fixture.detectChanges();

    const bookCards = fixture.nativeElement.querySelectorAll('.book-card');
    const firstCard = bookCards[0] as HTMLElement;
    const statusSpan = firstCard.querySelector('.book-card__status');
    expect(statusSpan).toBeTruthy();
    expect(statusSpan?.textContent?.trim()).toBe('Added');

    firstCard.click();
    expect(bookService.removeBook).toHaveBeenCalledWith('1');
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

    const clearButton = fixture.nativeElement.querySelector('.search-box__clear') as HTMLButtonElement;
    expect(clearButton).toBeTruthy();

    clearButton.click();
    expect(component.searchQuery()).toBe('');
  });
});
