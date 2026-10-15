import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { Recommendations } from './recommendations';
import { BookService } from '../../core/services/book.service';
import { Book } from '../../core/models/book.model';

describe('Recommendations', () => {
  let component: Recommendations;
  let fixture: ComponentFixture<Recommendations>;
  let selectedBooksSignal: ReturnType<typeof signal<Book[]>>;
  let selectedBooksCountSignal: ReturnType<typeof signal<number>>;
  let mockBookService: Partial<BookService>;

  const sampleBook: Book = {
    id: '1',
    title: '1984',
    author: 'George Orwell',
    genre: 'Dystopian Fiction',
  };

  beforeEach(async () => {
    selectedBooksSignal = signal<Book[]>([]);
    selectedBooksCountSignal = signal<number>(0);

    mockBookService = {
      selectedBooks: selectedBooksSignal.asReadonly(),
      selectedBooksCount: selectedBooksCountSignal.asReadonly(),
      removeBook: vi.fn((id: string) => {
        selectedBooksSignal.set(selectedBooksSignal().filter((b) => b.id !== id));
        selectedBooksCountSignal.set(selectedBooksSignal().length);
      }),
      addBook: vi.fn((book: Book) => {
        selectedBooksSignal.set([...selectedBooksSignal(), book]);
        selectedBooksCountSignal.set(selectedBooksSignal().length);
      }),
    };

    await TestBed.configureTestingModule({
      imports: [Recommendations],
      providers: [
        provideRouter([]),
        { provide: BookService, useValue: mockBookService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Recommendations);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create the recommendations component', () => {
    expect(component).toBeTruthy();
  });

  it('should display empty profile state when 0 books are selected', () => {
    fixture.detectChanges();
    const emptyState = fixture.nativeElement.querySelector('.empty-profile');
    expect(emptyState).toBeTruthy();
    expect(emptyState?.textContent).toContain('No books selected yet!');
  });

  it('should display selected books from global state and recommendations when books exist', () => {
    selectedBooksSignal.set([sampleBook]);
    selectedBooksCountSignal.set(1);
    fixture.detectChanges();

    const countBadge = fixture.nativeElement.querySelector('.count-number');
    expect(countBadge?.textContent?.trim()).toBe('1');

    const selectedCards = fixture.nativeElement.querySelectorAll('.selected-card');
    expect(selectedCards.length).toBe(1);
    expect(selectedCards[0].textContent).toContain('1984');

    const recCards = fixture.nativeElement.querySelectorAll('.rec-card');
    expect(recCards.length).toBeGreaterThan(0);
  });

  it('should allow removing a book from global state', () => {
    selectedBooksSignal.set([sampleBook]);
    selectedBooksCountSignal.set(1);
    fixture.detectChanges();

    const removeBtn = fixture.nativeElement.querySelector('.selected-card__remove');
    removeBtn?.click();

    expect(mockBookService.removeBook).toHaveBeenCalledWith('1');
  });

  it('should allow adding a recommended book to global state', () => {
    selectedBooksSignal.set([sampleBook]);
    selectedBooksCountSignal.set(1);
    fixture.detectChanges();

    const addRecBtn = fixture.nativeElement.querySelector('.btn-add-rec');
    addRecBtn?.click();

    expect(mockBookService.addBook).toHaveBeenCalled();
  });
});
