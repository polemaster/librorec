import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Dropdown, DropdownOption } from './dropdown';

describe('Dropdown', () => {
  let component: Dropdown;
  let fixture: ComponentFixture<Dropdown>;

  const options: DropdownOption[] = [
    { value: 'GEMINI', label: 'Gemini', description: 'Google Gemini AI model' },
    { value: 'OPENROUTER', label: 'OpenRouter', description: 'OpenRouter LLM gateway' },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Dropdown],
    }).compileComponents();

    fixture = TestBed.createComponent(Dropdown);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('options', options);
    fixture.componentRef.setInput('value', 'GEMINI');
    await fixture.whenStable();
  });

  it('should create and display the currently selected option label', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
    const trigger = fixture.nativeElement.querySelector('.dropdown__trigger') as HTMLButtonElement;
    expect(trigger.textContent?.trim()).toBe('Gemini');
    expect(fixture.nativeElement.querySelector('.dropdown__menu')).toBeFalsy();
  });

  it('should open menu on trigger click, emit valueChange on option click, and close menu', () => {
    const emitSpy = vi.spyOn(component.valueChange, 'emit');
    fixture.detectChanges();

    const trigger = fixture.nativeElement.querySelector('.dropdown__trigger') as HTMLButtonElement;
    trigger.click();
    fixture.detectChanges();

    const menu = fixture.nativeElement.querySelector('.dropdown__menu') as HTMLElement;
    expect(menu).toBeTruthy();

    const optionEls = Array.from(menu.querySelectorAll('.dropdown__option')) as HTMLElement[];
    expect(optionEls.length).toBe(2);

    optionEls[1].click();
    fixture.detectChanges();

    expect(emitSpy).toHaveBeenCalledWith('OPENROUTER');
    expect(fixture.nativeElement.querySelector('.dropdown__menu')).toBeFalsy();
  });
});
