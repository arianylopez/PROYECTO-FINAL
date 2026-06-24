import Block from '../../shared/lib/block/Block';
import template from './Header.hbs?raw';
import './Header.css';
import { routerInstance } from '../../shared/lib/router/Router';
import { authApi } from '../../shared/api/authApi';
import { authStore } from '../../shared/store/authStore';

export class Header extends Block {
  protected template = template;
  private clickOutsideHandler: (e: MouseEvent) => void;

  constructor() {
    super({ 
      isAuthenticated: false, 
      user: null,
      isDropdownOpen: false,
      isMobileMenuOpen: false,
      isSearchOpen: false,
      searchQuery: ''
    });

    this.clickOutsideHandler = this.handleClickOutside.bind(this);
  }

  protected componentDidMount() {
    const state = authStore.getState();
    this.updateUserProps(state);
    
    authStore.on('changed', (newState: any) => {
      this.updateUserProps(newState);
    });

    document.addEventListener('mousedown', this.clickOutsideHandler);

    // Parse query params to set initial search query
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('q')) {
      this.setProps({ searchQuery: urlParams.get('q') || '' });
    }
  }

  protected componentWillUnmount() {
    document.removeEventListener('mousedown', this.clickOutsideHandler);
  }

  private updateUserProps(state: any) {
    if (state.user) {
      const first_name = state.user.name ? state.user.name.split(' ')[0] : 'Usuario';
      const first_letter = state.user.name ? state.user.name.charAt(0).toUpperCase() : 'U';
      this.setProps({ 
        isAuthenticated: state.isAuthenticated, 
        user: { ...state.user, first_name, first_letter } 
      });
    } else {
      this.setProps({ isAuthenticated: false, user: null });
    }
  }

  private handleClickOutside(event: MouseEvent) {
    const target = event.target as Node;
    const dropdown = this.element?.querySelector('#user-menu-container');
    if (dropdown && !dropdown.contains(target) && this.props.isDropdownOpen) {
      this.setProps({ isDropdownOpen: false });
    }
  }

  protected events = {
    click: async (e: Event) => {
      const target = e.target as HTMLElement;
      
      const navigateBtn = target.closest('[data-navigate]');
      if (navigateBtn) {
        const path = navigateBtn.getAttribute('data-navigate');
        if (path) {
          this.setProps({ isDropdownOpen: false, isMobileMenuOpen: false, isSearchOpen: false });
          routerInstance.go(path);
        }
        return;
      }

      const toggleDropdownBtn = target.closest('#toggle-dropdown');
      if (toggleDropdownBtn) {
        this.setProps({ isDropdownOpen: !this.props.isDropdownOpen });
        return;
      }

      const toggleMobileBtn = target.closest('#toggle-mobile-nav');
      if (toggleMobileBtn) {
        this.setProps({ isMobileMenuOpen: !this.props.isMobileMenuOpen });
        return;
      }

      const toggleSearchBtn = target.closest('#toggle-search');
      if (toggleSearchBtn) {
        const isSearchOpen = !this.props.isSearchOpen;
        this.setProps({ isSearchOpen });
        if (isSearchOpen) {
          setTimeout(() => {
            const input = this.element?.querySelector('#search-input') as HTMLInputElement;
            if (input) input.focus();
          }, 100);
        }
        return;
      }

      const logoutBtn = target.closest('#nav-logout');
      if (logoutBtn) {
        try {
          await authApi.logout();
        } catch (error) {
        } finally {
          authStore.logout();
          this.setProps({ isDropdownOpen: false, isMobileMenuOpen: false });
          routerInstance.go('/login');
        }
        return;
      }
    },
    input: (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (target.id === 'search-input') {
        this.props.searchQuery = target.value; // Store silently
      }
    },
    submit: (e: Event) => {
      const form = e.target as HTMLFormElement;
      if (form.id === 'search-form') {
        e.preventDefault();
        const query = this.props.searchQuery.trim();
        this.setProps({ isSearchOpen: false });
        if (query) {
          routerInstance.go(`/home?q=${encodeURIComponent(query)}`);
        } else {
          routerInstance.go('/home');
        }
      }
    }
  };
}