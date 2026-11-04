import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { Recommendations } from './recommendations';
import { BookService } from '../../core/services/book.service';
import { Book, RecommendationMethod, RecommendationResponse } from '../../core/models/book.model';

describe('Recommendations', () => {
  let component: Recommendations;
  let fixture: ComponentFixture<Recommendations>;
  let selectedBooksSignal: ReturnType<typeof signal<Book[]>>;
  let selectedBooksCountSignal: ReturnType<typeof signal<number>>;
  let selectedMethodSignal: ReturnType<typeof signal<RecommendationMethod>>;
  let recommendedBooksSignal: ReturnType<typeof signal<RecommendationResponse[]>>;
  let isRecommendationsLoadingSignal: ReturnType<typeof signal<boolean>>;
  let recommendationsErrorSignal: ReturnType<typeof signal<string | null>>;
  let hasLoadedRecommendationsSignal: ReturnType<typeof signal<boolean>>;
  let mockBookService: Partial<BookService>;

  const sampleBook: Book = {
    slug: '1984',
    title: '1984',
    releaseDate: '1949-06-08',
    coverImgUrl: null,
    authors: ['George Orwell'],
    genres: ['Dystopian Fiction'],
    moods: ['dark'],
    tags: ['surveillance'],
  };

  const mockRecommendedBooks: RecommendationResponse[] = [
    {
      slug: 'dune',
      title: 'Dune',
      releaseDate: '1965-08-01',
      coverImgUrl: 'https://assets.hardcover.app/dune.jpg',
      seriesName: 'Dune Chronicles #1',
      description: 'Set on the desert planet Arrakis.',
      authors: ['Frank Herbert'],
      genres: ['Science Fiction', 'Space Opera', 'Adventure', 'Politics', 'Classics'],
    },
    {
      slug: 'brave-new-world',
      title: 'Brave New World',
      releaseDate: '1932-01-01',
      coverImgUrl: null,
      seriesName: null,
      description: 'A futuristic World State society.',
      authors: ['Aldous Huxley', 'Second Author'],
      genres: ['Dystopian Fiction'],
    },
    {
      slug: 'animal-farm',
      title: 'Animal Farm',
      releaseDate: '1945-08-17',
      coverImgUrl: 'https://assets.hardcover.app/animal-farm.jpg',
      seriesName: null,
      description: null,
      authors: ['George Orwell'],
      genres: ['Political Satire'],
    },
  ];

  beforeEach(async () => {
    selectedBooksSignal = signal<Book[]>([]);
    selectedBooksCountSignal = signal<number>(0);
    selectedMethodSignal = signal<RecommendationMethod>('GEMINI');
    recommendedBooksSignal = signal<RecommendationResponse[]>([]);
    isRecommendationsLoadingSignal = signal<boolean>(false);
    recommendationsErrorSignal = signal<string | null>(null);
    hasLoadedRecommendationsSignal = signal<boolean>(false);

    mockBookService = {
      selectedBooks: selectedBooksSignal.asReadonly(),
      selectedBooksCount: selectedBooksCountSignal.asReadonly(),
      selectedMethod: selectedMethodSignal.asReadonly(),
      recommendedBooks: recommendedBooksSignal.asReadonly(),
      isRecommendationsLoading: isRecommendationsLoadingSignal.asReadonly(),
      recommendationsError: recommendationsErrorSignal.asReadonly(),
      hasLoadedRecommendations: hasLoadedRecommendationsSignal.asReadonly(),
      setSelectedMethod: vi.fn((method: RecommendationMethod) => {
        selectedMethodSignal.set(method);
      }),
      fetchRecommendations: vi.fn((_books, method) => {
        if (method) {
          selectedMethodSignal.set(method);
        }
        recommendedBooksSignal.set(mockRecommendedBooks);
        hasLoadedRecommendationsSignal.set(true);
      }),
      removeBook: vi.fn((slug: string) => {
        selectedBooksSignal.set(selectedBooksSignal().filter((b) => b.slug !== slug));
        selectedBooksCountSignal.set(selectedBooksSignal().length);
      }),
      addBook: vi.fn((book: Book) => {
        selectedBooksSignal.set([...selectedBooksSignal(), book]);
        selectedBooksCountSignal.set(selectedBooksSignal().length);
      }),
      isBookSelected: vi.fn((slug: string) => selectedBooksSignal().some((b) => b.slug === slug)),
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
    expect(mockBookService.fetchRecommendations).not.toHaveBeenCalled();
  });

  it('should remember recommendations across navigation without triggering a new request automatically', () => {
    selectedBooksSignal.set([sampleBook]);
    selectedBooksCountSignal.set(1);
    recommendedBooksSignal.set(mockRecommendedBooks);
    hasLoadedRecommendationsSignal.set(true);
    fixture.detectChanges();

    expect(mockBookService.fetchRecommendations).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelectorAll('.rec-card').length).toBe(3);

    // Destroy and recreate component (simulating navigating away and back)
    fixture.destroy();
    const newFixture = TestBed.createComponent(Recommendations);
    newFixture.detectChanges();

    expect(mockBookService.fetchRecommendations).not.toHaveBeenCalled();
    expect(newFixture.nativeElement.querySelectorAll('.rec-card').length).toBe(3);
  });

  it('should show loading state when recommendations request is in flight', () => {
    selectedBooksSignal.set([sampleBook]);
    selectedBooksCountSignal.set(1);
    isRecommendationsLoadingSignal.set(true);
    fixture.detectChanges();

    expect(component.isLoading()).toBe(true);
    const loadingEl = fixture.nativeElement.querySelector('.rec-feedback--loading');
    expect(loadingEl).toBeTruthy();
    expect(loadingEl.textContent).toContain('Loading recommendations...');

    isRecommendationsLoadingSignal.set(false);
    recommendedBooksSignal.set(mockRecommendedBooks);
    hasLoadedRecommendationsSignal.set(true);
    fixture.detectChanges();

    expect(component.isLoading()).toBe(false);
    expect(fixture.nativeElement.querySelector('.rec-feedback--loading')).toBeFalsy();
    expect(fixture.nativeElement.querySelectorAll('.rec-card').length).toBe(3);
  });

  it('should display error message when backend request fails', () => {
    selectedBooksSignal.set([sampleBook]);
    selectedBooksCountSignal.set(1);
    recommendationsErrorSignal.set('Failed to load recommendations. Please try again.');
    hasLoadedRecommendationsSignal.set(true);
    fixture.detectChanges();

    expect(component.isLoading()).toBe(false);
    expect(component.errorMessage()).toBeTruthy();

    const errorEl = fixture.nativeElement.querySelector('.rec-feedback--error');
    expect(errorEl).toBeTruthy();
    expect(errorEl.textContent).toContain('Failed to load recommendations');
  });

  it('should display book cards with at most 3 genre tags and without description', () => {
    selectedBooksSignal.set([sampleBook]);
    selectedBooksCountSignal.set(1);
    recommendedBooksSignal.set(mockRecommendedBooks);
    fixture.detectChanges();

    const recCards = fixture.nativeElement.querySelectorAll('.rec-card');
    expect(recCards.length).toBe(3);

    const firstCard = recCards[0] as HTMLElement;
    expect(firstCard.querySelector('.rec-card__title')?.textContent?.trim()).toBe('Dune');
    expect(firstCard.querySelector('.rec-card__series')?.textContent?.trim()).toBe(
      'Dune Chronicles #1',
    );
    expect(firstCard.querySelector('.rec-card__author')?.textContent?.trim()).toBe(
      'by Frank Herbert',
    );
    expect(firstCard.querySelector('.rec-card__meta .rec-card__year')?.textContent?.trim()).toBe(
      '1965',
    );
    expect(firstCard.querySelector('.rec-card__description')).toBeFalsy();

    const allBottomTags = Array.from(
      firstCard.querySelectorAll('.rec-card__tags .rec-card__tag'),
    ).map((el) => el.textContent?.trim());
    expect(allBottomTags).toEqual(['Science Fiction', 'Space Opera', 'Adventure']);
  });

  it('should fetch covers asynchronously and replace spinner with cover image on load', () => {
    selectedBooksSignal.set([sampleBook]);
    selectedBooksCountSignal.set(1);
    recommendedBooksSignal.set(mockRecommendedBooks);
    fixture.detectChanges();

    const firstCard = fixture.nativeElement.querySelectorAll('.rec-card')[0] as HTMLElement;
    const coverWrapper = firstCard.querySelector('.rec-card__cover') as HTMLElement;
    expect(coverWrapper).toBeTruthy();

    expect(coverWrapper.querySelector('.rec-card__cover-spinner')).toBeTruthy();
    const coverImg = coverWrapper.querySelector('.rec-card__cover-img') as HTMLImageElement;
    expect(coverImg).toBeTruthy();
    expect(coverImg.classList.contains('rec-card__cover-img--loading')).toBe(true);

    coverImg.dispatchEvent(new Event('load'));
    fixture.detectChanges();

    expect(coverWrapper.querySelector('.rec-card__cover-spinner')).toBeFalsy();
    expect(coverImg.classList.contains('rec-card__cover-img--loading')).toBe(false);
  });

  it('should switch between grid view and list view', () => {
    selectedBooksSignal.set([sampleBook]);
    selectedBooksCountSignal.set(1);
    recommendedBooksSignal.set(mockRecommendedBooks);
    fixture.detectChanges();

    const container = fixture.nativeElement.querySelector('.rec-books') as HTMLElement;
    expect(container.classList.contains('rec-grid')).toBe(true);
    expect(container.classList.contains('rec-list')).toBe(false);

    const viewBtns = fixture.nativeElement.querySelectorAll('.rec-controls__view-btn');
    const listBtn = viewBtns[1] as HTMLButtonElement;
    listBtn.click();
    fixture.detectChanges();

    expect(component.viewMode()).toBe('list');
    expect(container.classList.contains('rec-list')).toBe(true);
    expect(container.classList.contains('rec-grid')).toBe(false);

    const gridBtn = viewBtns[0] as HTMLButtonElement;
    gridBtn.click();
    fixture.detectChanges();

    expect(component.viewMode()).toBe('grid');
    expect(container.classList.contains('rec-grid')).toBe(true);
  });

  it('should open modal with all book info including description and Hardcover button when a book is clicked, and close on X or outside click', () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    selectedBooksSignal.set([sampleBook]);
    selectedBooksCountSignal.set(1);
    recommendedBooksSignal.set(mockRecommendedBooks);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.rec-modal')).toBeFalsy();

    const firstCard = fixture.nativeElement.querySelectorAll('.rec-card')[0] as HTMLElement;
    firstCard.click();
    fixture.detectChanges();

    const modal = fixture.nativeElement.querySelector('.rec-modal') as HTMLElement;
    expect(modal).toBeTruthy();
    expect(modal.querySelector('.rec-modal__title')?.textContent?.trim()).toBe('Dune');
    expect(modal.querySelector('.rec-modal__series')?.textContent?.trim()).toBe(
      'Dune Chronicles #1',
    );
    expect(modal.querySelector('.rec-modal__author')?.textContent?.trim()).toBe('by Frank Herbert');
    expect(modal.querySelector('.rec-modal__release')?.textContent).toContain('1965-08-01');
    expect(modal.querySelector('.rec-modal__description')?.textContent?.trim()).toBe(
      'Set on the desert planet Arrakis.',
    );

    const modalGenres = Array.from(modal.querySelectorAll('.rec-card__tag--genre')).map((el) =>
      el.textContent?.trim(),
    );
    expect(modalGenres).toEqual([
      'Science Fiction',
      'Space Opera',
      'Adventure',
      'Politics',
      'Classics',
    ]);

    const hardcoverBtn = modal.querySelector('.rec-modal__hardcover-btn') as HTMLAnchorElement;
    expect(hardcoverBtn).toBeTruthy();
    expect(hardcoverBtn.getAttribute('href')).toBe('https://hardcover.app/books/dune');
    expect(hardcoverBtn.getAttribute('target')).toBe('_blank');

    hardcoverBtn.click();
    expect(openSpy).toHaveBeenCalledWith(
      'https://hardcover.app/books/dune',
      '_blank',
      'noopener,noreferrer',
    );

    // Close via X button
    const closeBtn = modal.querySelector('.rec-modal__close-btn') as HTMLButtonElement;
    closeBtn.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.rec-modal')).toBeFalsy();

    // Reopen and close via clicking outside (backdrop)
    firstCard.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.rec-modal')).toBeTruthy();

    const backdrop = fixture.nativeElement.querySelector('.rec-modal-backdrop') as HTMLElement;
    backdrop.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.rec-modal')).toBeFalsy();

    openSpy.mockRestore();
  });

  it('should only send a new request when explicitly clicking the Get recommendations again button', () => {
    selectedBooksSignal.set([sampleBook]);
    selectedBooksCountSignal.set(1);
    fixture.detectChanges();

    expect(mockBookService.fetchRecommendations).not.toHaveBeenCalled();

    const methodSelect = fixture.nativeElement.querySelector(
      '.rec-controls__method-select',
    ) as HTMLSelectElement;
    expect(methodSelect).toBeTruthy();

    methodSelect.value = 'OPENROUTER';
    methodSelect.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(component.selectedMethod()).toBe('OPENROUTER');
    expect(mockBookService.setSelectedMethod).toHaveBeenCalledWith('OPENROUTER');
    expect(mockBookService.fetchRecommendations).not.toHaveBeenCalled();

    const refreshBtn = fixture.nativeElement.querySelector(
      '.rec-controls__refresh-btn',
    ) as HTMLButtonElement;
    expect(refreshBtn).toBeTruthy();
    refreshBtn.click();
    fixture.detectChanges();

    expect(mockBookService.fetchRecommendations).toHaveBeenCalledTimes(1);
    expect(mockBookService.fetchRecommendations).toHaveBeenCalledWith([sampleBook], 'OPENROUTER');
  });

  it('should preserve original backend order and sort by recommended order, title, or author', () => {
    selectedBooksSignal.set([sampleBook]);
    selectedBooksCountSignal.set(1);
    recommendedBooksSignal.set(mockRecommendedBooks);
    fixture.detectChanges();

    // Default: original recommended order: Dune, Brave New World, Animal Farm
    expect(component.recommendations().map((b) => b.slug)).toEqual([
      'dune',
      'brave-new-world',
      'animal-farm',
    ]);

    const sortSelect = fixture.nativeElement.querySelector(
      '.rec-controls__sort-select',
    ) as HTMLSelectElement;
    expect(sortSelect).toBeTruthy();

    const options = Array.from(sortSelect.querySelectorAll('option')).map((o) =>
      o.textContent?.trim(),
    );
    expect(options).toEqual(['Recommended', 'Title', 'Author']);

    // Sort by title: Animal Farm, Brave New World, Dune
    sortSelect.value = 'title';
    sortSelect.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(component.recommendations().map((b) => b.slug)).toEqual([
      'animal-farm',
      'brave-new-world',
      'dune',
    ]);

    // Sort by first author: Aldous Huxley (brave-new-world), Frank Herbert (dune), George Orwell (animal-farm)
    sortSelect.value = 'author';
    sortSelect.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(component.recommendations().map((b) => b.slug)).toEqual([
      'brave-new-world',
      'dune',
      'animal-farm',
    ]);

    // Sort back by original recommended order: Dune, Brave New World, Animal Farm
    sortSelect.value = 'recommended';
    sortSelect.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(component.recommendations().map((b) => b.slug)).toEqual([
      'dune',
      'brave-new-world',
      'animal-farm',
    ]);
  });

  it('should not contain "Your Reading Profile" card or "Add to profile" buttons', () => {
    selectedBooksSignal.set([sampleBook]);
    selectedBooksCountSignal.set(1);
    recommendedBooksSignal.set(mockRecommendedBooks);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).not.toContain('Your Reading Profile');
    expect(fixture.nativeElement.querySelector('.profile-section')).toBeFalsy();
    expect(fixture.nativeElement.querySelector('.btn-add-rec')).toBeFalsy();
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
