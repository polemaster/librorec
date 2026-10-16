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
      isBookSelected: vi.fn((id: string) => selectedBooksSignal().some((b) => b.id === id)),
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

  it('should display empty recommendations state when 0 books are selected', () => {
    fixture.detectChanges();
    const emptyState = fixture.nativeElement.querySelector('.empty-recommendations');
    expect(emptyState).toBeTruthy();
    expect(emptyState?.textContent).toContain('No recommendations yet');
  });

  it('should not contain "Your Reading Profile" card', () => {
    selectedBooksSignal.set([sampleBook]);
    selectedBooksCountSignal.set(1);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).not.toContain('Your Reading Profile');
    expect(fixture.nativeElement.querySelector('.profile-section')).toBeFalsy();
  });

  it('should display recommendations when books exist in profile', () => {
    selectedBooksSignal.set([sampleBook]);
    selectedBooksCountSignal.set(1);
    fixture.detectChanges();

    const recCards = fixture.nativeElement.querySelectorAll('.rec-card');
    expect(recCards.length).toBeGreaterThan(0);
  });

  it('should not contain "Add to profile" buttons on recommendation cards', () => {
    selectedBooksSignal.set([sampleBook]);
    selectedBooksCountSignal.set(1);
    fixture.detectChanges();

    const addRecBtn = fixture.nativeElement.querySelector('.btn-add-rec');
    expect(addRecBtn).toBeFalsy();
  });

  it('should render heading and no paragraph below it in hero', () => {
    fixture.detectChanges();
    const heading = fixture.nativeElement.querySelector('.rec-hero__title');
    expect(heading).toBeTruthy();
    expect(heading?.textContent).toBe('Book Recommendations');

    const heroParagraph = fixture.nativeElement.querySelector('.rec-hero p');
    expect(heroParagraph).toBeFalsy();
  });
});
