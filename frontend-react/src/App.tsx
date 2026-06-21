import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { RegisterForm } from './features/auth/RegisterForm';
import { LoginForm } from './features/auth/LoginForm';
import { ForgotPasswordForm } from './features/auth/ForgotPasswordForm';
import { ResetPasswordForm } from './features/auth/ResetPasswordForm';
import { HomePage } from './pages/HomePage';
import { MovieDetailPage } from './pages/MovieDetailPage';
import { ScreeningSelectionPage } from './pages/ScreeningSelectionPage';
import { MainLayout } from './shared/components/layout/MainLayout';
import { SeatSelectionPage } from './pages/SeatSelectionPage';
import { PaymentPage } from './pages/PaymentPage';
import { TicketPage } from './pages/TicketPage';
import { OrdersHistoryPage } from './pages/OrdersHistoryPage';

function App() {
  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "631798098248-725ofbk4b17k45vpv3l6gsmetaukq89i.apps.googleusercontent.com";

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          
          <Route path="/register" element={<RegisterForm />} />
          <Route path="/login" element={<LoginForm />} />
          <Route path="/forgot-password" element={<ForgotPasswordForm />} />
          <Route path="/reset-password" element={<ResetPasswordForm />} />
          
          <Route element={<MainLayout />}>
            <Route path="/home" element={<HomePage />} />
            <Route path="/movie/:id" element={<MovieDetailPage />} />
            <Route path="/movie/:id/screenings" element={<ScreeningSelectionPage />} />
            <Route path="/booking/:id/seats" element={<SeatSelectionPage />} />
            <Route path="/booking/:id/seats" element={<SeatSelectionPage />} />
            <Route path="/booking/:id/payment" element={<PaymentPage />} />
            <Route path="/booking/:id/ticket" element={<TicketPage />} />
            <Route path="/me/orders" element={<OrdersHistoryPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}

export default App;