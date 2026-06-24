import Block from '../../shared/lib/block/Block';
import '../login/LoginPage.css'; // Reutilización limpia de estilos compartidos
import { routerInstance } from '../../shared/lib/router/Router';
import template from './ResetPasswordPage.hbs?raw';

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

      // Navegación nativa SPA
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

  /**
   * MOLDE INTERACTIVO: Envío del cambio de contraseña
   */
  private async handleResetSubmit(form: HTMLFormElement) {
    const passwordInput = form.querySelector('#reset-password') as HTMLInputElement;
    if (!passwordInput) return;

    // El experto usará esto para extraer el token real:
    // const searchParams = new URLSearchParams(window.location.search);
    // const token = searchParams.get('token');

    this.setProps({ isLoading: true, errorMsg: null, successMsg: null });

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      // CASO DE PRUEBA: Contraseña corta para pruebas visuales
      if (passwordInput.value.length < 8) {
        this.setProps({ errorMsg: 'La contraseña debe tener un mínimo de 8 caracteres.' });
        return;
      }

      this.setProps({ 
        successMsg: 'Contraseña actualizada correctamente. Redirigiendo al login...' 
      });

      // Simula el retraso antes de redirigir al login automáticamente
      setTimeout(() => {
        routerInstance.go('/login');
      }, 3000);

    } catch (error) {
      this.setProps({ errorMsg: 'Este enlace ya no es válido. Solicita uno nuevo.' });
    } finally {
      this.setProps({ isLoading: false });
    }
  }
}