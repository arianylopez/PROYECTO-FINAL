import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { apiClient } from '../../shared/api/apiClient';
import './RegisterForm.css';

const registerSchema = z.object({
  name: z.string().min(2, 'Ingresa tu nombre completo'),
  email: z.string().email('Correo electrónico inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
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
  const [serverError, setServerError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setServerError(null);
      
      const payload = {
        ...data,
        device_fingerprint: navigator.userAgent,
        device_name: "Navegador Web"
      };

      await apiClient.post('/auth/register', payload);
      
      window.location.href = '/onboarding';
    } catch (error: any) {
      if (error.response?.status === 409) {
        setServerError('Este correo electrónico ya está registrado. Ingresa a tu cuenta o recupera tu contraseña.');
      } else {
        setServerError(error.response?.data?.detail || 'Ocurrió un error en el servidor. Intenta más tarde.');
      }
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
            <h2 className="register-form__title">Sign Up</h2>
          </div>

          <p className="register-form__subtitle">Necesitas registrarte para completar tu compra</p>

          {serverError && <div className="register-form__alert register-form__alert--error">{serverError}</div>}

          <div className="register-form__field">
            <label className="register-form__label">Nombre completo</label>
            <input 
              className="register-form__input" 
              type="text" 
              placeholder="Ej. Leandro Lopez"
              {...register('name')} 
            />
            {errors.name && <span className="register-form__error">{errors.name.message}</span>}
          </div>

          <div className="register-form__field">
            <label className="register-form__label">Email</label>
            <input 
              className="register-form__input" 
              type="email" 
              placeholder="name@example.com"
              {...register('email')} 
            />
            {errors.email && <span className="register-form__error">{errors.email.message}</span>}
          </div>

          <div className="register-form__field">
            <label className="register-form__label">Password</label>
            <input 
              className="register-form__input" 
              type="password" 
              placeholder="Enter your password"
              {...register('password')} 
            />
            {errors.password && <span className="register-form__error">{errors.password.message}</span>}
          </div>

          <div className="register-form__field">
            <label className="register-form__label">Fecha de nacimiento</label>
            <input 
              className="register-form__input" 
              type="date" 
              {...register('birth_date')} 
            />
            {errors.birth_date && <span className="register-form__error">{errors.birth_date.message}</span>}
          </div>

          <button className="register-form__submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Procesando...' : 'Sign up'}
          </button>

          <div className="register-form__divider">OR</div>

          <button type="button" className="register-form__google">
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continuar con Google
          </button>

          <div className="register-form__footer">
            Already have an account? 
            <Link to="/login" className="register-form__link">Sign In</Link>
          </div>

        </form>
      </div>
      <div className="auth-layout__cover"></div>
    </div>
  );
};