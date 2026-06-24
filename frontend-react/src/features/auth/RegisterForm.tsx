import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { apiClient } from '../../shared/api/apiClient';
import { useAuthStore } from '../../shared/store/authStore';
import './RegisterForm.css';

const registerSchema = z.object({
  name: z.string().min(2, 'Ingresa tu nombre completo'),
  email: z.string().email('Correo electrónico inválido'),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/\d/, 'La contraseña debe contener al menos 1 número'),
  birth_date: z.string().refine((dateString) => {
    const today = new Date();
    const birthDate = new Date(dateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age >= 18;
  }, 'Debes ser mayor de 18 años para registrarte en CinemaPlus'),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export const RegisterForm = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [showBirthModal, setShowBirthModal] = useState(false);
  const [pendingGoogleData, setPendingGoogleData] = useState<any>(null);
  const [birthDate, setBirthDate] = useState('');
  const [modalError, setModalError] = useState('');

  const loginAction = useAuthStore((state) => state.login);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isDirty },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: 'onBlur',
  });

  const decodeJWT = (token: string) => {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  };

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      setServerError(null);
      setSuccessMessage(null);

      const payload = {
        ...data,
        device_fingerprint: navigator.userAgent,
        device_name: 'Navegador Web',
      };

      const response = await apiClient.post('/auth/register', payload);

      if (response.data.access_token && response.data.user) {
        loginAction(response.data.user, response.data.access_token);
      }

      // RUTA SIMPLIFICADA
      navigate('/preferences');
    } catch (error: any) {
      if (error.response?.status === 409) {
        setServerError(
          'Este correo electrónico ya está registrado. Ingresa a tu cuenta o usa "¿Olvidaste tu contraseña?"'
        );
      } else {
        const backendError = Array.isArray(error.response?.data?.detail)
          ? error.response.data.detail[0].msg
          : error.response?.data?.detail;
        setServerError(backendError || 'Ocurrió un error en el servidor. Intenta más tarde.');
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
          device_name: 'Navegador Web',
        });

        const token = response.data.access_token;
        const decodedUser = decodeJWT(token);
        loginAction(
          {
            id: decodedUser.sub,
            name: response.data.user.name,
            email: response.data.user.email,
            role: decodedUser.role,
          },
          token
        );

        navigate('/home');
      } catch (error: any) {
        if (error.response?.status === 404) {
          try {
            const { data } = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
            });
            setPendingGoogleData({ name: data.name, email: data.email });
            setShowBirthModal(true);
          } catch (e) {
            setServerError('No se pudo obtener tu información de Google.');
          }
        } else {
          setServerError('Error al conectar con Google. Inténtalo de nuevo.');
        }
      } finally {
        setIsGoogleLoading(false);
      }
    },
  });

  const handleGoogleRegisterComplete = async () => {
    if (!birthDate) {
      setModalError('Por favor ingresa tu fecha de nacimiento.');
      return;
    }
    setIsGoogleLoading(true);
    try {
      const response = await apiClient.post('/auth/register', {
        name: pendingGoogleData.name,
        email: pendingGoogleData.email,
        password: 'GAuth_Secure123!',
        birth_date: birthDate,
        device_fingerprint: navigator.userAgent,
        device_name: 'Navegador Web',
      });

      if (response.data.access_token && response.data.user) {
        loginAction(response.data.user, response.data.access_token);
      }

      // RUTA SIMPLIFICADA
      navigate('/preferences');
    } catch (error: any) {
      const backendError = Array.isArray(error.response?.data?.detail)
        ? error.response.data.detail[0].msg
        : error.response?.data?.detail;
      setModalError(backendError || 'Ocurrió un error al registrar.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      <div className="auth-layout__sidebar">
        <form className="register-form" onSubmit={handleSubmit(onSubmit)}>
          <div className="register-form__header">
            <div className="register-form__logo">
              <svg className="register-form__logo-icon" width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22 10V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v4c1.1 0 2 .9 2 2s-.9 2-2 2v4a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-4c-1.1 0-2-.9-2-2s.9-2 2-2z" />
              </svg>
              <span>CinemaPlus</span>
            </div>
            <h2 className="register-form__title">Sign Up</h2>
          </div>

          <p className="register-form__subtitle">Necesitas registrarte para completar tu compra</p>

          {serverError && <div className="register-form__alert register-form__alert--error">{serverError}</div>}
          {successMessage && <div className="register-form__alert register-form__alert--success">{successMessage}</div>}

          <div className="register-form__field">
            <label className="register-form__label" htmlFor="name">
              Nombre completo
            </label>
            <input
              id="name"
              className="register-form__input"
              type="text"
              placeholder="Ej. Leandro Lopez"
              {...register('name')}
              disabled={isLoading || isGoogleLoading}
            />
            {errors.name && <span className="register-form__error">{errors.name.message}</span>}
          </div>

          <div className="register-form__field">
            <label className="register-form__label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              className="register-form__input"
              type="email"
              placeholder="name@example.com"
              {...register('email')}
              disabled={isLoading || isGoogleLoading}
            />
            {errors.email && <span className="register-form__error">{errors.email.message}</span>}
          </div>

          <div className="register-form__field">
            <label className="register-form__label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              className="register-form__input"
              type="password"
              placeholder="Enter your password"
              {...register('password')}
              disabled={isLoading || isGoogleLoading}
            />
            {errors.password && <span className="register-form__error">{errors.password.message}</span>}
          </div>

          <div className="register-form__field">
            <label className="register-form__label" htmlFor="birth_date">
              Fecha de nacimiento
            </label>
            <input
              id="birth_date"
              className="register-form__input"
              type="date"
              {...register('birth_date')}
              disabled={isLoading || isGoogleLoading}
            />
            {errors.birth_date && <span className="register-form__error">{errors.birth_date.message}</span>}
          </div>

          <button
            className="register-form__submit"
            type="submit"
            disabled={isLoading || isGoogleLoading || (!isValid && isDirty)}
          >
            {isLoading ? 'Procesando...' : 'Sign up'}
          </button>

          <div className="register-form__divider">OR</div>

          <button
            type="button"
            className="register-form__google"
            onClick={() => loginWithGoogle()}
            disabled={isLoading || isGoogleLoading}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {isGoogleLoading ? 'Conectando...' : 'Continuar con Google'}
          </button>

          <div className="register-form__footer">
            Already have an account?
            <Link to="/login" className="register-form__link">
              Sign In
            </Link>
          </div>
        </form>
      </div>
      <div className="auth-layout__cover"></div>

      {showBirthModal && (
        <div className="auth-modal">
          <div className="auth-modal__content">
            <h3 className="auth-modal__title">¡Casi listo, {pendingGoogleData?.name}!</h3>
            <p className="auth-modal__desc">
              Para proteger a nuestra comunidad, necesitamos verificar tu edad antes de completar el registro.
            </p>

            {modalError && (
              <div className="register-form__alert register-form__alert--error" style={{ marginBottom: '1rem' }}>
                {modalError}
              </div>
            )}

            <div className="register-form__field" style={{ marginBottom: '1.5rem' }}>
              <label className="register-form__label" htmlFor="birthDate">
                Fecha de nacimiento
              </label>
              <input
                id="birthDate"
                type="date"
                className="register-form__input"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                disabled={isGoogleLoading}
              />
            </div>

            <button
              type="button"
              className="register-form__submit"
              onClick={handleGoogleRegisterComplete}
              disabled={isGoogleLoading}
              style={{ width: '100%' }}
            >
              {isGoogleLoading ? 'Procesando...' : 'Finalizar registro'}
            </button>
            <button
              type="button"
              onClick={() => setShowBirthModal(false)}
              className="auth-modal__btn-cancel auth-modal__btn-cancel--muted"
              disabled={isGoogleLoading}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
