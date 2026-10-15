import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { Home } from './home';
import { BookService } from '../../core/services/book.service';
import { Book } from '../../core/models/book.model';

describe('Home', () => {
  let component: Home;
  let fixture: ComponentFixture<Home>;
  let selectedBooksSignal: ReturnType<typeof signal<Book[]>>;
  let selectedBooksCountSignal: ReturnType<typeof signal<number>>;
  let mockBookService: Partial<BookService>;

  const sampleBook: Book = {
    id: '1',
    title: '1984',
    author: 'George Orwell',
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
      addBook: vi.fn(),
      isBookSelected: vi.fn().mockReturnValue(false),
      searchBooks: vi.fn().mockReturnValue(of([])),
    };

    await TestBed.configureTestingModule({
      imports: [Home],
      providers: [
        provideRouter([]),
        { provide: BookService, useValue: mockBookService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Home);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create the home page', () => {
    expect(component).toBeTruthy();
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
