import { routerInstance } from '../shared/lib/router/Router';
import { withMainLayout } from '../shared/ui/layout/MainLayout';
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

routerInstance
  .use('/home', () => import('../pages/home/HomePage').then(m => withMainLayout(m.HomePage)), { isDynamic: true })
  .use('/login', () => import('../pages/login/LoginPage').then(m => m.LoginPage), { requireGuest: true, isDynamic: true })
  .use('/register', () => import('../pages/register/RegisterPage').then(m => m.RegisterPage), { requireGuest: true, isDynamic: true })
  .use('/forgot-password', () => import('../pages/forgot-password/ForgotPasswordPage').then(m => m.ForgotPasswordPage), { requireGuest: true, isDynamic: true })
  .use('/reset-password', () => import('../pages/reset-password/ResetPasswordPage').then(m => m.ResetPasswordPage), { requireGuest: true, isDynamic: true })
  .use('/preferences', () => import('../pages/preferences/OnboardingPreferencesPage').then(m => m.OnboardingPreferencesPage), { requireAuth: true, isDynamic: true })
  .use('/movie/:id', () => import('../pages/movie-detail/MovieDetailPage').then(m => withMainLayout(m.MovieDetailPage)), { isDynamic: true })
  .use('/movie/:id/screenings', () => import('../pages/screening-selection/ScreeningSelectionPage').then(m => withMainLayout(m.ScreeningSelectionPage)), { isDynamic: true })
  .use('/booking/:id/seats', () => import('../pages/seat-selection/SeatSelectionPage').then(m => withMainLayout(m.SeatSelectionPage)), { requireAuth: true, isDynamic: true })
  .use('/booking/:id/payment', () => import('../pages/payment/PaymentPage').then(m => withMainLayout(m.PaymentPage)), { requireAuth: true, isDynamic: true })
  .use('/booking/:id/ticket', () => import('../pages/ticket/TicketPage').then(m => withMainLayout(m.TicketPage)), { requireAuth: true, isDynamic: true })
  .use('/me/orders', () => import('../pages/orders/OrdersHistoryPage').then(m => withMainLayout(m.OrdersHistoryPage)), { requireAuth: true, isDynamic: true })
  .start();

if (window.location.pathname === '/') {
  routerInstance.go('/login');
}