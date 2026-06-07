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
  const [message, setMessage] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(forgotSchema),
  });

  const onSubmit = async (data: { email: string }) => {
    try {
      await apiClient.post('/auth/password-reset-request', data);
      setMessage('Si ese correo existe en nuestro sistema, recibirás un enlace en los próximos minutos');
    } catch (error) {
      setMessage('Si ese correo existe en nuestro sistema, recibirás un enlace en los próximos minutos');
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
            <label className="register-form__label">Email</label>
            <input className="register-form__input" type="email" {...register('email')} />
            {errors.email && <span className="register-form__error">{errors.email?.message as string}</span>}
          </div>

          <button className="register-form__submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Enviando...' : 'Enviar enlace'}
          </button>

          <div className="register-form__footer">
            <Link to="/login" className="register-form__link">Volver al Login</Link>
          </div>
        </form>
      </div>
      <div className="auth-layout__cover"></div>
    </div>
  );
};