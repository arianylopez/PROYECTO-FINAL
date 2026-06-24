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
import { SeatSelectionPage } from '../pages/seat-selection/SeatSelectionPage';
import { PaymentPage } from '../pages/payment/PaymentPage';
import { TicketPage } from '../pages/ticket/TicketPage';
import { OrdersHistoryPage } from '../pages/orders/OrdersHistoryPage';
import { OnboardingPreferencesPage } from '../pages/preferences/OnboardingPreferencesPage';

routerInstance
  .use('/home', withMainLayout(HomePage))
  .use('/login', LoginPage, { requireGuest: true })
  .use('/register', RegisterPage, { requireGuest: true })
  .use('/forgot-password', ForgotPasswordPage, { requireGuest: true })
  .use('/reset-password', ResetPasswordPage, { requireGuest: true })
  .use('/preferences', OnboardingPreferencesPage, { requireAuth: true })
  .use('/movie/:id', withMainLayout(MovieDetailPage))
  .use('/movie/:id/screenings', withMainLayout(ScreeningSelectionPage))
  .use('/booking/:id/seats', withMainLayout(SeatSelectionPage), { requireAuth: true })
  .use('/booking/:id/payment', withMainLayout(PaymentPage), { requireAuth: true })
  .use('/booking/:id/ticket', withMainLayout(TicketPage), { requireAuth: true })
  .use('/me/orders', withMainLayout(OrdersHistoryPage), { requireAuth: true })
  .start();

if (window.location.pathname === '/') {
  routerInstance.go('/login');
}