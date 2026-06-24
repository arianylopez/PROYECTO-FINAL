import Block from '../../shared/lib/block/Block';
import '../login/LoginPage.css'; // Reutilización de los estilos compartidos de autenticación
import template from './RegisterPage.hbs?raw';
import { routerInstance } from '../../shared/lib/router/Router';

interface RegisterPageProps {
  serverError?: string | null;
  isLoading?: boolean;
  isGoogleLoading?: boolean;
  showBirthModal?: boolean;
  pendingGoogleData?: { name: string; email: string } | null;
  modalError?: string;
  birthDate?: string;
}

export class RegisterPage extends Block {
  protected template = template;

  constructor(props: RegisterPageProps = {}) {
    super({
      serverError: null,
      isLoading: false,
      isGoogleLoading: false,
      showBirthModal: false,
      pendingGoogleData: null,
      modalError: '',
      birthDate: '',
      ...props
    });
  }

  protected events = {
    click: (e: Event) => {
      const target = e.target as HTMLElement;

      // Navegación nativa con routerInstance
      const navigateRoute = target.closest('[data-navigate]')?.getAttribute('data-navigate');
      if (navigateRoute) {
        e.preventDefault();
        routerInstance.go(navigateRoute);
        return;
      }

      // Registro con Google OAuth
      if (target.closest('#reg-google-btn')) {
        e.preventDefault();
        this.registerWithGoogleMock();
        return;
      }

      // Cerrar modal flotante
      if (target.closest('[data-close-modal]')) {
        this.setProps({ showBirthModal: false, modalError: '' });
        return;
      }

      // Finalizar flujo desde el modal de Google
      if (target.closest('#finalizar-registro-btn')) {
        this.handleGoogleRegisterCompleteMock();
        return;
      }
    },

    submit: (e: Event) => {
      e.preventDefault();
      const form = e.target as HTMLFormElement;
      if (form.id === 'register-form-element') {
        this.handleRegisterSubmit(form);
      }
    },

    input: (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (target.id === 'modal-birthdate-input') {
        this.setProps({ birthDate: target.value });
      }
    }
  };

  /**
   * MOLDE: Envío del formulario tradicional de registro
   */
  private async handleRegisterSubmit(form: HTMLFormElement) {
    this.setProps({ isLoading: true, serverError: null });

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // El experto configurará las validaciones reales aquí. 
      // Redirección directa simulada para visualización de la UI.
      routerInstance.go('/onboarding');
    } catch {
      this.setProps({ serverError: 'Ocurrió un error al registrar la cuenta.' });
    } finally {
      this.setProps({ isLoading: false });
    }
  }

  /**
   * MOLDE: Lanzamiento de la autenticación alternativa vía Google
   */
  private async registerWithGoogleMock() {
    this.setProps({ isGoogleLoading: true, serverError: null });
    await new Promise(resolve => setTimeout(resolve, 800));

    // Levanta el modal complementario para testear la UI tal como en React
    this.setProps({
      pendingGoogleData: { name: "Arima Guerrero", email: "arima.dev@google.com" },
      showBirthModal: true,
      isGoogleLoading: false
    });
  }

  /**
   * MOLDE: Confirmación final del formulario del modal de edad
   */
  private async handleGoogleRegisterCompleteMock() {
    const { birthDate } = this.props as RegisterPageProps;

    if (!birthDate) {
      this.setProps({ modalError: "Por favor ingresa tu fecha de nacimiento." });
      return;
    }

    this.setProps({ isGoogleLoading: true, modalError: '' });
    await new Promise(resolve => setTimeout(resolve, 800));
    
    this.setProps({ isGoogleLoading: false, showBirthModal: false });
    routerInstance.go('/onboarding');
  }
}