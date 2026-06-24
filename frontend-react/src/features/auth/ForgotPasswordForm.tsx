import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { apiClient } from '../../shared/api/apiClient';
import './RegisterForm.css';

const forgotSchema = z.object({
  email: z.string().email('Correo electrónico inválido'),
});

export const ForgotPasswordForm = () => {
  const [message] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [demoLink, setDemoLink] = useState<string | null>(null); 

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(forgotSchema),
  });

  const onSubmit = async (data: { email: string }) => {
    setIsLoading(true);
    setDemoLink(null);
    try {
      const response = await apiClient.post('/auth/password-reset-request', data);
      
      if (response.data && response.data.demo_link) {
        setDemoLink(response.data.demo_link);
      }
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      <div className="auth-layout__sidebar">
        <form className="register-form" onSubmit={handleSubmit(onSubmit)}>
          <div className="register-form__header">
            <h2 className="register-form__title">Recuperar Contraseña</h2>
          </div>
          <p className="register-form__subtitle">Ingresa tu correo para recibir un enlace de recuperación.</p>

          {message && <div className="register-form__alert register-form__alert--success">{message}</div>}

          <div className="register-form__field">
            <label className="register-form__label" htmlFor="email">Email</label>
            <input id="email" className="register-form__input" type="email" placeholder="name@example.com" {...register('email')} disabled={isLoading} />
            {errors.email && <span className="register-form__error">{errors.email?.message as string}</span>}
          </div>

          <button className="register-form__submit" type="submit" disabled={isLoading}>
            {isLoading ? 'Enviando...' : 'Enviar enlace'}
          </button>

          {demoLink && (
            <div className="register-form__demo-box">
              <p className="register-form__demo-text"></p>
              <a href={demoLink} className="register-form__submit register-form__demo-link">
                Hacer clic para recuperar contraseña 
              </a>
            </div>
          )}

          <div className="register-form__footer">
            <Link to="/login" className="register-form__link">Volver al Login</Link>
          </div>
        </form>
      </div>
      <div className="auth-layout__cover"></div>
    </div>
  );
};