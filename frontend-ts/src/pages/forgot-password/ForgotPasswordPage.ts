import Block from '../../shared/lib/block/Block';
import '../login/LoginPage.css'; // Reutiliza tu hoja de estilos unificada
import { routerInstance } from '../../shared/lib/router/Router';
import template from './ForgotPasswordPage.hbs?raw';

interface ForgotPasswordPageProps {
  message?: string | null;
  serverError?: string | null;
  isLoading?: boolean;
  demoLink?: string | null;
}

export class ForgotPasswordPage extends Block {
  protected template = template;

  constructor(props: ForgotPasswordPageProps = {}) {
    super({
      message: null,
      serverError: null,
      isLoading: false,
      demoLink: null,
      ...props
    });
  }

  protected events = {
    click: (e: Event) => {
      const target = e.target as HTMLElement;

      // Navegación SPA unificada a través del atributo data-navigate
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
      if (form.id === 'forgot-password-form') {
        this.handleForgotSubmit(form);
      }
    }
  };

  /**
   * MOLDE INTERACTIVO: Envío de solicitud de recuperación
   */
  private async handleForgotSubmit(form: HTMLFormElement) {
    const emailInput = form.querySelector('#forgot-email') as HTMLInputElement;
    if (!emailInput) return;

    this.setProps({ isLoading: true, serverError: null, message: null, demoLink: null });

    try {
      // Simulación de retraso de red
      await new Promise(resolve => setTimeout(resolve, 1000));

      // CASO DE PRUEBA: Si el usuario escribe 'error@cinema.com', gatilla un fallo visual
      if (emailInput.value === 'error@cinema.com') {
        this.setProps({ serverError: 'El correo electrónico no se encuentra registrado.' });
        return;
      }

      // Flujo exitoso por defecto: Setea el mensaje y abre el demoLink simulado para pruebas de UI
      this.setProps({
        message: 'Se ha enviado un enlace de recuperación a tu correo.',
        demoLink: '/reset-password?token=mock-crypto-token-123'
      });

    } catch (error) {
      this.setProps({ serverError: 'Ocurrió un error inesperado. Inténtalo más tarde.' });
    } finally {
      this.setProps({ isLoading: false });
    }
  }
}