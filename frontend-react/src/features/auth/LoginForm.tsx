import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useSearchParams } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { apiClient } from '../../shared/api/apiClient';
import { useAuthStore } from '../../shared/store/authStore';
import './RegisterForm.css';

const loginSchema = z.object({
  email: z.string().email('Correo electrónico inválido'),
  password: z.string().min(1, 'Ingresa tu contraseña'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginForm = () => {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false); 
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  
  const [devicesLimit, setDevicesLimit] = useState<any[]>([]);
  const [showBirthModal, setShowBirthModal] = useState(false);
  const [pendingGoogleData, setPendingGoogleData] = useState<any>(null);
  const [birthDate, setBirthDate] = useState("");
  const [modalError, setModalError] = useState("");

  const loginAction = useAuthStore((state) => state.login);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get('error') === 'google_unregistered') {
      setServerError('Cuenta de Google no encontrada. Por favor regístrate aquí.');
    }
  }, [searchParams]);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const decodeJWT = (token: string) => {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
    return JSON.parse(jsonPayload);
  };

  const processSuccessfulLogin = (token: string, fallbackName: string, fallbackEmail: string) => {
    const decodedUser = decodeJWT(token);
    loginAction({
      id: decodedUser.sub,
      name: fallbackName, 
      email: fallbackEmail,
      role: decodedUser.role
    }, token);
    window.location.assign('/home'); 
  };

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      setServerError(null);
      const payload = {
        email: data.email,
        password: data.password,
        device_fingerprint: navigator.userAgent,
        device_name: "Navegador Web"
      };
      const response = await apiClient.post('/auth/login', payload);
      processSuccessfulLogin(response.data.access_token, response.data.user?.name || data.email.split('@')[0], data.email);
    } catch (error: any) {
      if (error.response?.status === 401) {
        setServerError('Correo o contraseña incorrectos'); 
      } else if (error.response?.status === 429) {
        setServerError('Demasiados intentos. Intentá nuevamente en 5 minutos.');
      } else if (error.response?.status === 403 && error.response.data.devices) {
        setDevicesLimit(error.response.data.devices);
      } else {
        setServerError('Error al intentar iniciar sesión');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsGoogleLoading(true);
      try {
        setServerError(null);
        const response = await apiClient.post('/auth/google', { 
          token: tokenResponse.access_token, 
          device_fingerprint: navigator.userAgent,
          device_name: "Navegador Web"
        });
        processSuccessfulLogin(response.data.access_token, response.data.user.name, response.data.user.email);
      } catch (error: any) {
        if (error.response?.status === 404) {
          try {
            const { data } = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
            });
            setPendingGoogleData({ name: data.name, email: data.email });
            setShowBirthModal(true); 
          } catch(e) {
            setServerError('No se pudo obtener información de Google.');
          }
        } else if (error.response?.status === 403 && error.response.data.devices) {
          setDevicesLimit(error.response.data.devices);
        } else {
          setServerError('Error al autenticar con Google');
        }
      } finally {
        setIsGoogleLoading(false);
      }
    },
  });

  const handleGoogleRegisterComplete = async () => {
    if (!birthDate) {
      setModalError("Por favor ingresa tu fecha de nacimiento.");
      return;
    }
    setIsGoogleLoading(true);
    try {
      await apiClient.post('/auth/register', {
        name: pendingGoogleData.name,
        email: pendingGoogleData.email,
        password: "GAuth_Secure123!", 
        birth_date: birthDate,
        device_fingerprint: navigator.userAgent,
        device_name: "Navegador Web"
      });
      window.location.assign('/onboarding');
    } catch (error: any) {
      setModalError(error.response?.data?.detail || "Ocurrió un error al registrar.");
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleRevoke = async (deviceId: string) => {
    try {
      await apiClient.post(`/auth/devices/${deviceId}/revoke`);
      setDevicesLimit([]); 
      handleSubmit(onSubmit)(); 
    } catch (error) {
      setServerError('No se pudo revocar el dispositivo.');
    }
  };

  return (
    <div className="auth-layout">
      <div className="auth-layout__sidebar">
        <form className="register-form" onSubmit={handleSubmit(onSubmit)}>
          
          <div className="register-form__header">
            <div className="register-form__logo">
              <svg className="register-form__logo-icon" width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22 10V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v4c1.1 0 2 .9 2 2s-.9 2-2 2v4a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-4c-1.1 0-2-.9-2-2s.9-2 2-2z"/>
              </svg>
              <span>CinemaPlus</span>
            </div>
            <h2 className="register-form__title">Sign In</h2>
          </div>

          <p className="register-form__subtitle">Necesitas ingresar para completar tu compra</p>

          {serverError && <div className="register-form__alert register-form__alert--error">{serverError}</div>}

          <div className="register-form__field">
            <label className="register-form__label" htmlFor="email">Email</label>
            <input id="email" className="register-form__input" type="email" placeholder="name@example.com" {...register('email')} disabled={isLoading} />
            {errors.email && <span className="register-form__error">{errors.email.message}</span>}
          </div>

          <div className="register-form__field">
            <label className="register-form__label" htmlFor="password">Password</label>
            <div className="register-form__input-wrapper">
              <input id="password" className="register-form__input" type="password" placeholder="Enter your password" {...register('password')} disabled={isLoading} />
            </div>
            {errors.password && <span className="register-form__error">{errors.password.message}</span>}
          </div>

          <Link to="/forgot-password" className="register-form__link register-form__link--forgot">¿Olvidaste tu contraseña?</Link>

          <button className="register-form__submit" type="submit" disabled={isLoading}>
            {isLoading ? 'Verificando...' : 'Sign in'}
          </button>

          <div className="register-form__divider">OR</div>

          <button type="button" className="register-form__google" onClick={() => loginWithGoogle()} disabled={isGoogleLoading}>
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {isGoogleLoading ? 'Conectando...' : 'Continuar con Google'}
          </button>

          <div className="register-form__footer">
            Don't have an account? <Link to="/register" className="register-form__link">Sign Up</Link>
          </div>
        </form>
      </div>

      <div className="auth-layout__cover"></div>

      {/* MODAL 1: Límite de Dispositivos */}
      {devicesLimit.length > 0 && (
        <div className="auth-modal">
          <div className="auth-modal__content">
            <h3 className="auth-modal__title auth-modal__title--error">Límite de dispositivos (3/3)</h3>
            <p className="auth-modal__desc auth-modal__desc--muted">Revoca una sesión activa para ingresar desde este nuevo dispositivo.</p>
            {devicesLimit.map(d => (
              <div key={d.id} className="auth-modal__device">
                <div>
                  <strong className="auth-modal__device-name">{d.name}</strong>
                  <span className="auth-modal__device-date">Última vez: {new Date(d.last_seen).toLocaleDateString()}</span>
                </div>
                <button type="button" onClick={() => handleRevoke(d.id)} className="auth-modal__btn-revoke">Revocar</button>
              </div>
            ))}
            <button type="button" onClick={() => setDevicesLimit([])} className="auth-modal__btn-cancel">Cancelar</button>
          </div>
        </div>
      )}

      {showBirthModal && (
        <div className="auth-modal">
          <div className="auth-modal__content">
            <h3 className="auth-modal__title">¡Casi listo, {pendingGoogleData?.name}!</h3>
            <p className="auth-modal__desc">Para proteger a nuestra comunidad, necesitamos verificar tu edad antes de completar el registro.</p>
            
            {modalError && <div className="register-form__alert register-form__alert--error" style={{marginBottom: '1rem'}}>{modalError}</div>}
            
            <div className="register-form__field" style={{marginBottom: '1.5rem'}}>
              <label className="register-form__label" htmlFor="birthDate">Fecha de nacimiento</label>
              <input id="birthDate" type="date" className="register-form__input" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} disabled={isGoogleLoading} />
            </div>

            <button type="button" className="register-form__submit" onClick={handleGoogleRegisterComplete} disabled={isGoogleLoading} style={{width: '100%'}}>
              {isGoogleLoading ? 'Procesando...' : 'Finalizar registro'}
            </button>
            <button type="button" onClick={() => setShowBirthModal(false)} className="auth-modal__btn-cancel auth-modal__btn-cancel--muted">Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
};