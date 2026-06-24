import Block from '../../shared/lib/block/Block';
import './LoginPage.css';
import { routerInstance } from '../../shared/lib/router/Router';
import template from './LoginPage.hbs?raw';

interface LoginPageProps {
  subtitleText?: string;
  serverError?: string | null;
  isLoading?: boolean;
  isGoogleLoading?: boolean;
  devicesLimit?: any[];
  showBirthModal?: boolean;
  pendingGoogleData?: { name: string; email: string } | null;
  modalError?: string;
  birthDate?: string;
}

export class LoginPage extends Block {
  protected template = template;

  constructor(props: LoginPageProps = {}) {
    // Leemos los parámetros nativos del navegador para clonar el comportamiento de React
    const searchParams = new URLSearchParams(window.location.search);
    const fromCheckout = searchParams.get('from') === 'checkout';
    
    const defaultSubtitle = fromCheckout 
      ? 'Necesitas ingresar para completar tu compra' 
      : 'Bienvenido de nuevo a CinemaPlus';

    super({
      subtitleText: defaultSubtitle,
      serverError: null,
      isLoading: false,
      isGoogleLoading: false,
      devicesLimit: [],
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

      const navigateRoute = target.closest('[data-navigate]')?.getAttribute('data-navigate');
      if (navigateRoute) {
        e.preventDefault();
        routerInstance.go(navigateRoute);
        return;
      }

      if (target.closest('#log-google-btn')) {
        e.preventDefault();
        this.loginWithGoogleMock();
        return;
      }

      const revokeBtn = target.closest('[data-revoke-id]');
      if (revokeBtn) {
        const deviceId = revokeBtn.getAttribute('data-revoke-id')!;
        this.handleRevokeMock(deviceId);
        return;
      }

      if (target.closest('[data-close-modal]')) {
        this.setProps({ devicesLimit: [], showBirthModal: false, modalError: '' });
        return;
      }

      if (target.closest('#finalizar-registro-btn')) {
        this.handleGoogleRegisterCompleteMock();
        return;
      }
    },

    submit: (e: Event) => {
      e.preventDefault();
      const form = e.target as HTMLFormElement;
      if (form.id === 'login-form-element') {
        this.handleLoginSubmit(form);
      }
    },

    input: (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (target.id === 'modal-birthdate-input') {
        this.setProps({ birthDate: target.value });
      }
    }
  };

  private async handleLoginSubmit(form: HTMLFormElement) {
    const emailInput = form.querySelector('#login-email') as HTMLInputElement;
    if (!emailInput) return;

    this.setProps({ isLoading: true, serverError: null });

    try {
      await new Promise(resolve => setTimeout(resolve, 800));

      if (emailInput.value === 'error@cinema.com') {
        this.setProps({ serverError: 'Correo o contraseña incorrectos' });
        return;
      }

      if (emailInput.value === 'limite@cinema.com') {
        this.setProps({ 
          devicesLimit: [
            { id: '1', name: 'ASUS TUF Gaming F15', last_seen: '23/06/2026' }
          ]
        });
        return;
      }

      routerInstance.go('/home');
    } catch {
      this.setProps({ serverError: 'Error al procesar el formulario.' });
    } finally {
      this.setProps({ isLoading: false });
    }
  }

  private async handleRevokeMock(_deviceId: string) {
    this.setProps({ isLoading: true });
    await new Promise(resolve => setTimeout(resolve, 500));
    this.setProps({ devicesLimit: [], serverError: 'Dispositivo revocado. Intenta ingresar.', isLoading: false });
  }

  private async loginWithGoogleMock() {
    this.setProps({ isGoogleLoading: true });
    await new Promise(resolve => setTimeout(resolve, 800));
    this.setProps({
      pendingGoogleData: { name: "Arima", email: "arima@google.com" },
      showBirthModal: true,
      isGoogleLoading: false
    });
  }

  private async handleGoogleRegisterCompleteMock() {
    const { birthDate } = this.props as LoginPageProps;
    if (!birthDate) {
      this.setProps({ modalError: "Ingresa tu fecha de nacimiento." });
      return;
    }
    this.setProps({ showBirthModal: false });
    routerInstance.go('/home');
  }
}