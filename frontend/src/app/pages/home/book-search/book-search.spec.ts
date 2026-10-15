import { ComponentFixture, TestBed } from '@angular/core/testing';
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
        {
          provide: BookService,
          useValue: {
            selectedBooks: () => [],
            selectedBooksCount: () => 0,
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

  it('should display initial number of books added as 0', () => {
    fixture.detectChanges();
    const countElement = fixture.nativeElement.querySelector('.badge-count');
    expect(countElement?.textContent?.trim()).toBe('0');
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

  it('should render search results and add book when clicked', () => {
    component.searchQuery.set('Orwell');
    component.onSearchSubmit();
    fixture.detectChanges();

    const bookCards = fixture.nativeElement.querySelectorAll('.book-card');
    expect(bookCards.length).toBe(2);

    const firstCardTitle = bookCards[0].querySelector('.book-card__title');
    expect(firstCardTitle?.textContent?.trim()).toBe('1984');

    const addButton = bookCards[0].querySelector('.btn--add');
    expect(addButton?.textContent?.trim()).toBe('+ Add Book');

    addButton?.click();
    expect(bookService.addBook).toHaveBeenCalledWith(mockBooks[0]);
  });

  it('should display "Added" button if book is selected and allow removal', () => {
    vi.mocked(bookService.isBookSelected).mockImplementation((id) => id === '1');

    component.searchQuery.set('Orwell');
    component.onSearchSubmit();
    fixture.detectChanges();

    const bookCards = fixture.nativeElement.querySelectorAll('.book-card');
    const addedButton = bookCards[0].querySelector('.btn--added');
    expect(addedButton?.textContent?.trim()).toContain('Added');

    addedButton?.click();
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
});
