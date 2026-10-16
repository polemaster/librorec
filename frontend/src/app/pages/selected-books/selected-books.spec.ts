import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { SelectedBooks } from './selected-books';
import { BookService } from '../../core/services/book.service';
import { Book } from '../../core/models/book.model';

describe('SelectedBooks', () => {
  let component: SelectedBooks;
  let fixture: ComponentFixture<SelectedBooks>;
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
      clearSelectedBooks: vi.fn(() => {
        selectedBooksSignal.set([]);
        selectedBooksCountSignal.set(0);
      }),
    };

    await TestBed.configureTestingModule({
      imports: [SelectedBooks],
      providers: [
        provideRouter([]),
        { provide: BookService, useValue: mockBookService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SelectedBooks);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create the selected books component', () => {
    expect(component).toBeTruthy();
  });

  it('should render the heading and no paragraph below it in hero', () => {
    fixture.detectChanges();
    const heading = fixture.nativeElement.querySelector('.selected-hero__title');
    expect(heading).toBeTruthy();
    expect(heading?.textContent).toBe('Your Selected Books');

    const heroParagraph = fixture.nativeElement.querySelector('.selected-hero p');
    expect(heroParagraph).toBeFalsy();
  });

  it('should show empty state when no books are selected', () => {
    fixture.detectChanges();
    const emptyState = fixture.nativeElement.querySelector('.empty-state');
    expect(emptyState).toBeTruthy();
    expect(emptyState?.textContent).toContain('No books added to your profile yet');
  });

  it('should display selected books and count when books exist in global state', () => {
    selectedBooksSignal.set([sampleBook]);
    selectedBooksCountSignal.set(1);
    fixture.detectChanges();

    const countBadge = fixture.nativeElement.querySelector('.count-number');
    expect(countBadge?.textContent?.trim()).toBe('1');

    const chips = fixture.nativeElement.querySelectorAll('.selected-chip');
    expect(chips.length).toBe(1);
    expect(chips[0].querySelector('.selected-chip__title')?.textContent).toBe('1984');
  });

  it('should call removeBook when remove button is clicked', () => {
    selectedBooksSignal.set([sampleBook]);
    selectedBooksCountSignal.set(1);
    fixture.detectChanges();

    const removeBtn = fixture.nativeElement.querySelector('.selected-chip__remove-btn');
    removeBtn?.click();

    expect(mockBookService.removeBook).toHaveBeenCalledWith('1');
  });

  it('should call clearSelectedBooks when clear all button is clicked', () => {
    selectedBooksSignal.set([sampleBook]);
    selectedBooksCountSignal.set(1);
    fixture.detectChanges();

    const clearBtn = fixture.nativeElement.querySelector('.btn-clear');
    clearBtn?.click();

    expect(mockBookService.clearSelectedBooks).toHaveBeenCalled();
  });
});
