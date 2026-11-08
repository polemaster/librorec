import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { Header } from './header';
import { BookService } from '../../core/services/book.service';
import { BookSearchApi, RecommendationMethod } from '../../core/models/book.model';

describe('Header', () => {
  let component: Header;
  let fixture: ComponentFixture<Header>;
  let selectedBooksCountSignal: ReturnType<typeof signal<number>>;
  let selectedMethodSignal: ReturnType<typeof signal<RecommendationMethod>>;
  let selectedSearchApiSignal: ReturnType<typeof signal<BookSearchApi>>;
  let mockBookService: Partial<BookService>;

  beforeEach(async () => {
    selectedBooksCountSignal = signal(0);
    selectedMethodSignal = signal<RecommendationMethod>('GEMINI');
    selectedSearchApiSignal = signal<BookSearchApi>('HARDCOVER');

    mockBookService = {
      selectedBooksCount: selectedBooksCountSignal.asReadonly(),
      selectedMethod: selectedMethodSignal.asReadonly(),
      selectedSearchApi: selectedSearchApiSignal.asReadonly(),
      setSelectedMethod: vi.fn((method: RecommendationMethod) => {
        selectedMethodSignal.set(method);
      }),
      setSelectedSearchApi: vi.fn((api: BookSearchApi) => {
        selectedSearchApiSignal.set(api);
      }),
    };

    await TestBed.configureTestingModule({
      imports: [Header],
      providers: [
        provideRouter([]),
        {
          provide: BookService,
          useValue: mockBookService,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Header);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display count badge when books are selected in global state', () => {
    fixture.detectChanges();
    let badge = fixture.nativeElement.querySelector('.navbar__badge');
    expect(badge).toBeFalsy();

    selectedBooksCountSignal.set(3);
    fixture.detectChanges();

    badge = fixture.nativeElement.querySelector('.navbar__badge');
    expect(badge).toBeTruthy();
    expect(badge.textContent?.trim()).toBe('3');
  });

  it('should render settings icon button next to Log In button and allow changing method and search API via custom dropdowns', () => {
    fixture.detectChanges();
    const settingsBtn = fixture.nativeElement.querySelector(
      '.header__btn--settings',
    ) as HTMLButtonElement;
    expect(settingsBtn).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.settings-modal')).toBeFalsy();

    settingsBtn.click();
    fixture.detectChanges();

    const modal = fixture.nativeElement.querySelector('.settings-modal') as HTMLElement;
    expect(modal).toBeTruthy();

    // Open method dropdown and select OpenRouter
    const methodDropdown = modal.querySelector('.settings-modal__method-dropdown') as HTMLElement;
    expect(methodDropdown).toBeTruthy();
    const methodTrigger = methodDropdown.querySelector('.dropdown__trigger') as HTMLButtonElement;
    expect(methodTrigger.textContent?.trim()).toBe('Gemini');

    methodTrigger.click();
    fixture.detectChanges();

    const methodOptions = Array.from(
      methodDropdown.querySelectorAll('.dropdown__option'),
    ) as HTMLElement[];
    expect(methodOptions.length).toBe(2);
    methodOptions[1].click();
    fixture.detectChanges();

    expect(mockBookService.setSelectedMethod).toHaveBeenCalledWith('OPENROUTER');
    expect(methodTrigger.textContent?.trim()).toBe('OpenRouter');

    // Open search API dropdown and select OpenLibrary
    const apiDropdown = modal.querySelector('.settings-modal__api-dropdown') as HTMLElement;
    expect(apiDropdown).toBeTruthy();
    const apiTrigger = apiDropdown.querySelector('.dropdown__trigger') as HTMLButtonElement;
    expect(apiTrigger.textContent?.trim()).toBe('Hardcover');

    apiTrigger.click();
    fixture.detectChanges();

    const apiOptions = Array.from(
      apiDropdown.querySelectorAll('.dropdown__option'),
    ) as HTMLElement[];
    expect(apiOptions.length).toBe(2);
    apiOptions[1].click();
    fixture.detectChanges();

    expect(mockBookService.setSelectedSearchApi).toHaveBeenCalledWith('OPENLIBRARY');
    expect(apiTrigger.textContent?.trim()).toBe('OpenLibrary');

    const closeBtn = modal.querySelector('.settings-modal__close-btn') as HTMLButtonElement;
    closeBtn.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.settings-modal')).toBeFalsy();
  });
});
