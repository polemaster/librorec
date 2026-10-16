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
  let mockBookService: Partial<BookService>;

  beforeEach(async () => {
    mockBookService = {
      selectedBooks: signal<Book[]>([]),
      selectedBooksCount: signal(0),
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

  it('should render the "Search for Books" heading and no paragraph below it', () => {
    fixture.detectChanges();
    const heading = fixture.nativeElement.querySelector('.home-hero__title');
    expect(heading).toBeTruthy();
    expect(heading?.textContent).toBe('Search for Books');

    const heroParagraph = fixture.nativeElement.querySelector('.home-hero p');
    expect(heroParagraph).toBeFalsy();
  });

  it('should render book search component', () => {
    fixture.detectChanges();
    const searchComponent = fixture.nativeElement.querySelector('app-book-search');
    expect(searchComponent).toBeTruthy();
  });

  it('should not contain the "Build Your Reading Profile" heading', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).not.toContain('Build Your Reading Profile');
  });

  it('should not contain the selected books section', () => {
    fixture.detectChanges();
    const selectedSection = fixture.nativeElement.querySelector('.selected-section');
    expect(selectedSection).toBeFalsy();
  });
});
