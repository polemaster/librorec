import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Recommendations } from './pages/recommendations/recommendations';

export const routes: Routes = [
  {
    path: '',
    component: Home,
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
