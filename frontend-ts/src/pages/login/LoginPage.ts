import Block from '../../shared/lib/block/Block';
import './LoginPage.css';
import { routerInstance } from '../../shared/lib/router/Router';
import template from './LoginPage.hbs?raw';
import { authApi } from '../../shared/api/authApi';
import { authStore } from '../../shared/store/authStore';

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

  private decodeJWT(token: string) {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
    return JSON.parse(jsonPayload);
  }

  private processSuccessfulLogin(token: string, fallbackName: string, fallbackEmail: string) {
    const decodedUser = this.decodeJWT(token);
    authStore.login({
      id: decodedUser.sub,
      name: fallbackName,
      email: fallbackEmail,
      role: decodedUser.role
    }, token);
    routerInstance.go('/home');
  }

  private async handleLoginSubmit(form: HTMLFormElement) {
    const emailInput = form.querySelector('#login-email') as HTMLInputElement;
    const passwordInput = form.querySelector('#login-password') as HTMLInputElement;
    if (!emailInput || !passwordInput) return;

    this.setProps({ isLoading: true, serverError: null });

    try {
      const payload = {
        email: emailInput.value,
        password: passwordInput.value,
        device_fingerprint: navigator.userAgent,
        device_name: "Navegador Web"
      };
      const response = await authApi.login(payload);
      this.processSuccessfulLogin(response.access_token, response.user?.name || payload.email.split('@')[0], payload.email);
    } catch (error: any) {
      if (error.response?.status === 401) {
        this.setProps({ serverError: 'Correo o contraseña incorrectos' });
      } else if (error.response?.status === 429) {
        this.setProps({ serverError: 'Demasiados intentos. Intentá nuevamente en 5 minutos.' });
      } else if (error.response?.status === 403 && error.response.data?.devices) {
        this.setProps({ devicesLimit: error.response.data.devices });
      } else {
        this.setProps({ serverError: 'Error al intentar iniciar sesión' });
      }
    } finally {
      this.setProps({ isLoading: false });
    }
  }

  private async handleRevokeMock(deviceId: string) {
    this.setProps({ isLoading: true });
    try {
      await authApi.revokeDevice(deviceId);
      this.setProps({ devicesLimit: [], serverError: 'Dispositivo revocado. Intenta ingresar nuevamente.', isLoading: false });
    } catch (error) {
      this.setProps({ serverError: 'No se pudo revocar el dispositivo.', isLoading: false });
    }
  }

  private loginWithGoogleMock() {
    this.setProps({ isGoogleLoading: true });
    // @ts-expect-error Google is loaded via script
    const client = google.accounts.oauth2.initTokenClient({
      client_id: '631798098248-725ofbk4b17k45vpv3l6gsmetaukq89i.apps.googleusercontent.com',
      scope: 'email profile',
      callback: async (tokenResponse: any) => {
        try {
          this.setProps({ serverError: null });
          const response = await authApi.loginWithGoogle({
            token: tokenResponse.access_token,
            device_fingerprint: navigator.userAgent,
            device_name: "Navegador Web"
          });
          this.processSuccessfulLogin(response.access_token, response.user.name, response.user.email);
        } catch (error: any) {
          if (error.response?.status === 404) {
            try {
              const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
              });
              const data = await res.json();
              this.setProps({
                pendingGoogleData: { name: data.name, email: data.email },
                showBirthModal: true
              });
            } catch(e) {
              this.setProps({ serverError: 'No se pudo obtener información de Google.' });
            }
          } else if (error.response?.status === 403 && error.response.data?.devices) {
            this.setProps({ devicesLimit: error.response.data.devices });
          } else {
            this.setProps({ serverError: 'Error al autenticar con Google' });
          }
        } finally {
          this.setProps({ isGoogleLoading: false });
        }
      },
    });
    client.requestAccessToken();
  }

  private async handleGoogleRegisterCompleteMock() {
    const { birthDate, pendingGoogleData } = this.props as LoginPageProps;
    if (!birthDate) {
      this.setProps({ modalError: "Ingresa tu fecha de nacimiento." });
      return;
    }
    this.setProps({ isGoogleLoading: true });
    try {
      await authApi.register({
        name: pendingGoogleData?.name,
        email: pendingGoogleData?.email,
        password: "GAuth_Secure123!",
        birth_date: birthDate,
        device_fingerprint: navigator.userAgent,
        device_name: "Navegador Web"
      });
      routerInstance.go('/preferences');
    } catch (error: any) {
      this.setProps({ modalError: error.response?.data?.detail || "Ocurrió un error al registrar." });
    } finally {
      this.setProps({ isGoogleLoading: false });
    }
  }
}