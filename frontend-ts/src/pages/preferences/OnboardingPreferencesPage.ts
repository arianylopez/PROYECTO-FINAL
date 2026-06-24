import Block from '../../shared/lib/block/Block';
import template from './OnboardingPreferencesPage.hbs?raw';
import { routerInstance } from '../../shared/lib/router/Router';
import { authStore } from '../../shared/store/authStore';
import { fetchGenres } from '../../features/catalog/catalogApi';
import { apiClient } from '../../shared/api/apiClient';

export class OnboardingPreferencesPage extends Block {
  protected template = template;

  constructor() {
    super({
      isLoading: true,
      errorMsg: '',
      genres: [],
      selected: [],
      renderedGenres: [],
      isSaveDisabled: true
    });
  }

  protected async componentDidMount() {
    const state = authStore.getState();
    if (!state.user) {
      routerInstance.go('/login');
      return;
    }

    try {
      const genres = await fetchGenres();
      this.setProps({ genres });
      this.updateRenderedGenres();
    } catch (err) {
      console.error(err);
      this.setProps({ errorMsg: 'Error al cargar géneros' });
    } finally {
      this.setProps({ isLoading: false });
    }

    authStore.on('changed', () => {
      const s = authStore.getState();
      if (!s.user) {
        routerInstance.go('/login');
      }
    });
  }

  private updateRenderedGenres() {
    const { genres, selected } = this.props;
    const renderedGenres = genres.map((g: string) => ({
      genre: g,
      isSelected: selected.includes(g)
    }));
    this.setProps({ renderedGenres, isSaveDisabled: selected.length === 0 });
  }

  private toggleGenre(genre: string) {
    this.setProps({ errorMsg: '' });
    let selected: string[] = [...this.props.selected];
    
    if (selected.includes(genre)) {
      selected = selected.filter(g => g !== genre);
    } else {
      if (selected.length >= 5) {
        this.setProps({ errorMsg: "Podés seleccionar hasta 5 géneros" });
        return;
      }
      selected.push(genre);
    }
    
    this.setProps({ selected });
    this.updateRenderedGenres();
  }

  private async handleSave() {
    const state = authStore.getState();
    if (!state.user) return;

    try {
      await apiClient.put(`/api/v1/auth/users/${state.user.id}/preferences`, { genres: this.props.selected });
      routerInstance.go('/home');
    } catch (error: any) {
      const backendError = error.response?.data?.detail?.[0]?.msg || "Error al guardar preferencias";
      this.setProps({ errorMsg: backendError.replace('Value error, ', '') });
    }
  }

  private handleSkip() {
    routerInstance.go('/home');
  }

  protected events = {
    click: (e: Event) => {
      const target = e.target as HTMLElement;
      
      const btnGenre = target.closest('.btn-genre');
      if (btnGenre) {
        const genre = btnGenre.getAttribute('data-genre');
        if (genre) this.toggleGenre(genre);
        return;
      }

      if (target.id === 'btn-save') {
        if (!target.hasAttribute('disabled')) {
          this.handleSave();
        }
        return;
      }

      if (target.id === 'btn-skip') {
        this.handleSkip();
        return;
      }
    }
  };
}
