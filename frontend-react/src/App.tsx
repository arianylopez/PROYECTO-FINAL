import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { RegisterForm } from './features/auth/RegisterForm';
import { LoginForm } from './features/auth/LoginForm';
import { ForgotPasswordForm } from './features/auth/ForgotPasswordForm';
import { ResetPasswordForm } from './features/auth/ResetPasswordForm';

const HomeTemp = () => <div style={{ color: 'white', padding: '2rem', textAlign: 'center' }}><h1>Cartelera Principal</h1></div>;
const OnboardingTemp = () => <div style={{ color: 'white', padding: '2rem', textAlign: 'center' }}><h1>Elige tus géneros favoritos</h1></div>;

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
          
          <Route path="/home" element={<HomeTemp />} />
          <Route path="/onboarding" element={<OnboardingTemp />} />
        </Routes>
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}

export default App;