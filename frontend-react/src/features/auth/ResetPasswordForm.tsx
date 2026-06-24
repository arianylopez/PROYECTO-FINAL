import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiClient } from '../../shared/api/apiClient';
import './RegisterForm.css';

const resetSchema = z.object({
  password: z.string().min(8, 'Mínimo 8 caracteres'),
});

export const ResetPasswordForm = () => {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(resetSchema),
  });

  const onSubmit = async (data: { password: string }) => {
    const token = searchParams.get('token');
    if (!token) {
      setErrorMsg('El enlace no es válido. No se encontró el token.');
      return;
    }

    try {
      await apiClient.post('/auth/password-reset', { token, new_password: data.password });
      setSuccessMsg('Contraseña actualizada correctamente. Redirigiendo al login...');
      setTimeout(() => navigate('/login'), 3000);
    } catch (error: any) {
      setErrorMsg(error.response?.data?.detail || 'Este enlace ya no es válido. Solicitá uno nuevo.');
    }
  };

  return (
    <div className="auth-layout">
      <div className="auth-layout__sidebar">
        <form className="register-form" onSubmit={handleSubmit(onSubmit)}>
          <div className="register-form__header">
            <h2 className="register-form__title">Nueva Contraseña</h2>
          </div>
          
          {successMsg && <div className="register-form__alert register-form__alert--success">{successMsg}</div>}
          {errorMsg && <div className="register-form__alert register-form__alert--error">{errorMsg}</div>}

          <div className="register-form__field">
            <label className="register-form__label" htmlFor="password">Nueva Contraseña</label>
            <input id="password" className="register-form__input" type="password" {...register('password')} />
            {errors.password && <span className="register-form__error">{errors.password?.message as string}</span>}
          </div>

          <button className="register-form__submit" type="submit" disabled={isSubmitting || !!successMsg}>
            {isSubmitting ? 'Guardando...' : 'Guardar nueva contraseña'}
          </button>
        </form>
      </div>
      <div className="auth-layout__cover"></div>
    </div>
  );
};