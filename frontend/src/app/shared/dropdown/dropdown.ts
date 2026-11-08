import {
  Component,
  ElementRef,
  HostListener,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { Icon } from '../icon/icon';

export interface DropdownOption<T extends string = string> {
  value: T;
  label: string;
  description?: string;
}

@Component({
  selector: 'app-dropdown',
  imports: [Icon],
  templateUrl: './dropdown.html',
  styleUrl: './dropdown.scss',
})
export class Dropdown<T extends string = string> {
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  readonly options = input.required<DropdownOption<T>[]>();
  readonly value = input.required<T>();
  readonly ariaLabel = input<string>('Select option');

  readonly valueChange = output<T>();

  readonly isOpen = signal(false);

  readonly selectedOption = computed<DropdownOption<T> | undefined>(() => {
    const current = this.value();
    const list = this.options();
    return list.find((opt) => opt.value === current) ?? list[0];
  });

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.isOpen()) {
      return;
    }
    const target = event.target as Node | null;
    if (target && !this.elementRef.nativeElement.contains(target)) {
      this.close();
    }
  }

  toggle(): void {
    this.isOpen.update((open) => !open);
  }

  open(): void {
    this.isOpen.set(true);
  }

  close(): void {
    this.isOpen.set(false);
  }

  selectOption(option: DropdownOption<T>): void {
    if (option.value !== this.value()) {
      this.valueChange.emit(option.value);
    }
    this.close();
  }

  onTriggerKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.isOpen()) {
      event.stopPropagation();
      this.close();
      return;
    }

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const opts = this.options();
      if (opts.length === 0) return;

      if (!this.isOpen()) {
        this.open();
        return;
      }

      const currentIndex = opts.findIndex((o) => o.value === this.value());
      const delta = event.key === 'ArrowDown' ? 1 : -1;
      const nextIndex = (currentIndex + delta + opts.length) % opts.length;
      this.valueChange.emit(opts[nextIndex].value);
    }
  }
}
