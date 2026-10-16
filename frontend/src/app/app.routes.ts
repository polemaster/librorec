import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Recommendations } from './pages/recommendations/recommendations';
import { SelectedBooks } from './pages/selected-books/selected-books';

export const routes: Routes = [
  {
    path: '',
    component: Home,
  },
  {
    path: 'selected-books',
    component: SelectedBooks,
  },
  {
    path: 'selected',
    redirectTo: 'selected-books',
  },
  {
    path: 'profile',
    redirectTo: 'selected-books',
  },
  {
    path: 'recommendations',
    component: Recommendations,
  },
  {
    path: '**',
    redirectTo: '',
  },
];
