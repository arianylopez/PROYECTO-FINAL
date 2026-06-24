import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { ScrollToTop } from './shared/components/ScrollToTop';
import { MainLayout } from './shared/components/layout/MainLayout';

const RegisterForm = React.lazy(() =>
  import('./features/auth/RegisterForm').then((module) => ({ default: module.RegisterForm }))
);
const LoginForm = React.lazy(() =>
  import('./features/auth/LoginForm').then((module) => ({ default: module.LoginForm }))
);
const ForgotPasswordForm = React.lazy(() =>
  import('./features/auth/ForgotPasswordForm').then((module) => ({ default: module.ForgotPasswordForm }))
);
const ResetPasswordForm = React.lazy(() =>
  import('./features/auth/ResetPasswordForm').then((module) => ({ default: module.ResetPasswordForm }))
);

const HomePage = React.lazy(() => import('./pages/HomePage').then((module) => ({ default: module.HomePage })));
const MovieDetailPage = React.lazy(() =>
  import('./pages/MovieDetailPage').then((module) => ({ default: module.MovieDetailPage }))
);
const ScreeningSelectionPage = React.lazy(() =>
  import('./pages/ScreeningSelectionPage').then((module) => ({ default: module.ScreeningSelectionPage }))
);
const SeatSelectionPage = React.lazy(() =>
  import('./pages/SeatSelectionPage').then((module) => ({ default: module.SeatSelectionPage }))
);
const PaymentPage = React.lazy(() => import('./pages/PaymentPage').then((module) => ({ default: module.PaymentPage })));
const TicketPage = React.lazy(() => import('./pages/TicketPage').then((module) => ({ default: module.TicketPage })));
const OrdersHistoryPage = React.lazy(() =>
  import('./pages/OrdersHistoryPage').then((module) => ({ default: module.OrdersHistoryPage }))
);
const OnboardingPreferencesPage = React.lazy(() =>
  import('./pages/OnboardingPreferencesPage').then((m) => ({ default: m.OnboardingPreferencesPage }))
);

const GlobalLoader = () => (
  <div
    style={{
      minHeight: '100vh',
      backgroundColor: '#0f1115',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      color: '#f4e951',
      fontFamily: 'system-ui',
      fontSize: '1.2rem',
      fontWeight: 'bold',
      letterSpacing: '2px',
    }}
  >
    CARGANDO...
  </div>
);

function App() {
  const GOOGLE_CLIENT_ID =
    import.meta.env.VITE_GOOGLE_CLIENT_ID || '631798098248-725ofbk4b17k45vpv3l6gsmetaukq89i.apps.googleusercontent.com';

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <ScrollToTop />
        <Suspense fallback={<GlobalLoader />}>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />

            <Route path="/register" element={<RegisterForm />} />
            <Route path="/login" element={<LoginForm />} />
            <Route path="/forgot-password" element={<ForgotPasswordForm />} />
            <Route path="/reset-password" element={<ResetPasswordForm />} />
            <Route path="/preferences" element={<OnboardingPreferencesPage />} />

            <Route element={<MainLayout />}>
              <Route path="/home" element={<HomePage />} />
              <Route path="/movie/:id" element={<MovieDetailPage />} />
              <Route path="/movie/:id/screenings" element={<ScreeningSelectionPage />} />
              <Route path="/booking/:id/seats" element={<SeatSelectionPage />} />
              <Route path="/booking/:id/payment" element={<PaymentPage />} />
              <Route path="/booking/:id/ticket" element={<TicketPage />} />
              <Route path="/me/orders" element={<OrdersHistoryPage />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}

export default App;
