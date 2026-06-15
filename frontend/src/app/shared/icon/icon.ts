import { Component, input } from '@angular/core';

@Component({
  selector: 'app-icon',
  imports: [],
  templateUrl: './icon.html',
  styleUrl: './icon.scss',
})
export class IconComponent {
  name = input.required<string>();
  size = input<string>('1em');
}
