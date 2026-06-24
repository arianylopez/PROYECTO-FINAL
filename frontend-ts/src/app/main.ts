import { HomePage } from '../pages/home/HomePage';
import { LoginPage } from '../pages/login/LoginPage';
import { RegisterPage } from '../pages/register/RegisterPage';
import { MovieDetailPage } from '../pages/movie-detail/MovieDetailPage'
import { routerInstance } from '../shared/lib/router/Router';
import { withMainLayout } from '../shared/ui/layout/MainLayout';
import { ForgotPasswordPage } from '../pages/forgot-password/ForgotPasswordPage';
import { ResetPasswordPage } from '../pages/reset-password/ResetPasswordPage';
import './styles/global.css';
import Handlebars from 'handlebars';

Handlebars.registerHelper('eq', function (a, b) {
  return a === b;
});

Handlebars.registerHelper('not', function (a) {
  return !a;
});

Handlebars.registerHelper('and', function (a, b) {
  return a && b;
});

Handlebars.registerHelper('formatPrice', function (price: number) {
  return price ? price.toFixed(2) : '0.00';
});

import { ScreeningSelectionPage } from '../pages/screening-selection/ScreeningSelectionPage';

routerInstance
  .use('/home', withMainLayout(HomePage))
  .use('/login', LoginPage, { requireGuest: true })
  .use('/register', RegisterPage, { requireGuest: true })
  .use('/forgot-password', ForgotPasswordPage, { requireGuest: true })
  .use('/reset-password', ResetPasswordPage, { requireGuest: true })
  .use('/movie/:id', withMainLayout(MovieDetailPage))
  .use('/booking/:id/screenings', withMainLayout(ScreeningSelectionPage))
  .start();

if (window.location.pathname === '/') {
  routerInstance.go('/login');
}