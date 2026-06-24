import Block from '../../shared/lib/block/Block';
import '../login/LoginPage.css'; // Reutilización de los estilos compartidos de autenticación
import { routerInstance } from '../../shared/lib/router/Router';
import template from './RegisterPage.hbs?raw';
import { authApi } from '../../shared/api/authApi';
import { authStore } from '../../shared/store/authStore';

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

      const navigateRoute = target.closest('[data-navigate]')?.getAttribute('data-navigate');
      if (navigateRoute) {
        e.preventDefault();
        routerInstance.go(navigateRoute);
        return;
      }

      if (target.closest('#reg-google-btn')) {
        e.preventDefault();
        this.registerWithGoogleMock();
        return;
      }

      if (target.closest('[data-close-modal]')) {
        this.setProps({ showBirthModal: false, modalError: '' });
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
      if (form.id === 'register-form-element') {
        this.handleRegisterSubmit(form);
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
    routerInstance.go('/preferences');
  }

  private async handleRegisterSubmit(form: HTMLFormElement) {
    const nameInput = form.querySelector('#reg-name') as HTMLInputElement;
    const emailInput = form.querySelector('#reg-email') as HTMLInputElement;
    const passwordInput = form.querySelector('#reg-password') as HTMLInputElement;
    const birthdateInput = form.querySelector('#reg-birthdate') as HTMLInputElement;

    if (!nameInput || !emailInput || !passwordInput || !birthdateInput) return;

    this.setProps({ isLoading: true, serverError: null });

    try {
      const payload = {
        name: nameInput.value,
        email: emailInput.value,
        password: passwordInput.value,
        birth_date: birthdateInput.value,
        device_fingerprint: navigator.userAgent,
        device_name: "Navegador Web"
      };
      
      const response = await authApi.register(payload);
      this.processSuccessfulLogin(response.access_token, response.user?.name || payload.name, payload.email);
    } catch (error: any) {
      const detail = error.response?.data?.detail;
      const backendError = Array.isArray(detail) ? detail[0].msg : detail;
      this.setProps({ serverError: backendError || 'Ocurrió un error al registrar la cuenta.' });
    } finally {
      this.setProps({ isLoading: false });
    }
  }

  private registerWithGoogleMock() {
    this.setProps({ isGoogleLoading: true, serverError: null });
    
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
    const { pendingGoogleData } = this.props as RegisterPageProps;
    const dateInput = document.getElementById('modal-birthdate-input') as HTMLInputElement;
    const birthDateValue = dateInput ? dateInput.value : '';

    if (!birthDateValue) {
      this.setProps({ modalError: "Por favor ingresa tu fecha de nacimiento." });
      return;
    }

    this.setProps({ isGoogleLoading: true, modalError: '' });
    
    try {
      const response = await authApi.register({
        name: pendingGoogleData?.name,
        email: pendingGoogleData?.email,
        password: "GAuth_Secure123!",
        birth_date: birthDateValue,
        device_fingerprint: navigator.userAgent,
        device_name: "Navegador Web"
      });
      this.processSuccessfulLogin(response.access_token, response.user.name, response.user.email);
    } catch (error: any) {
      const detail = error.response?.data?.detail;
      const backendError = Array.isArray(detail) ? detail[0].msg : detail;
      this.setProps({ modalError: backendError || "Ocurrió un error al registrar." });
    } finally {
      this.setProps({ isGoogleLoading: false, showBirthModal: false });
    }
  }
}