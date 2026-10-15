import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { Header } from './header';
import { BookService } from '../../core/services/book.service';

describe('Header', () => {
  let component: Header;
  let fixture: ComponentFixture<Header>;
  let selectedBooksCountSignal: ReturnType<typeof signal<number>>;

  beforeEach(async () => {
    selectedBooksCountSignal = signal(0);

    await TestBed.configureTestingModule({
      imports: [Header],
      providers: [
        provideRouter([]),
        {
          provide: BookService,
          useValue: {
            selectedBooksCount: selectedBooksCountSignal.asReadonly(),
          },
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
});
