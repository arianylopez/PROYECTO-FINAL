import Block from '../../shared/lib/block/Block';
import '../login/LoginPage.css'; // Reutilización limpia de estilos compartidos
import { routerInstance } from '../../shared/lib/router/Router';
import template from './ResetPasswordPage.hbs?raw';
import { authApi } from '../../shared/api/authApi';

interface ResetPasswordPageProps {
  errorMsg?: string | null;
  successMsg?: string | null;
  isLoading?: boolean;
}

export class ResetPasswordPage extends Block {
  protected template = template;

  constructor(props: ResetPasswordPageProps = {}) {
    super({
      errorMsg: null,
      successMsg: null,
      isLoading: false,
      ...props
    });
  }

  protected events = {
    click: (e: Event) => {
      const target = e.target as HTMLElement;

      const navigateRoute = target.closest('[data-navigate]')?.getAttribute('data-navigate');
      if (navigateRoute) {
        e.preventDefault();
        routerInstance.go(navigateRoute);
        return;
      }
    },

    submit: (e: Event) => {
      e.preventDefault();
      const form = e.target as HTMLFormElement;
      if (form.id === 'reset-password-form') {
        this.handleResetSubmit(form);
      }
    }
  };

  private async handleResetSubmit(form: HTMLFormElement) {
    const passwordInput = form.querySelector('#reset-password') as HTMLInputElement;
    if (!passwordInput) return;

    const searchParams = new URLSearchParams(window.location.search);
    const token = searchParams.get('token');

    this.setProps({ isLoading: true, errorMsg: null, successMsg: null });

    if (!token) {
      this.setProps({ errorMsg: 'Token no proporcionado. Solicita un nuevo enlace.', isLoading: false });
      return;
    }

    try {
      await authApi.resetPassword({ token, new_password: passwordInput.value });
      this.setProps({ 
        successMsg: 'Contraseña actualizada correctamente. Redirigiendo al login...' 
      });

      setTimeout(() => {
        routerInstance.go('/login');
      }, 3000);
    } catch (error: any) {
      this.setProps({ errorMsg: error.response?.data?.detail || 'Este enlace ya no es válido. Solicita uno nuevo.' });
    } finally {
      this.setProps({ isLoading: false });
    }
  }
}