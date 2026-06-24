import Block from '../../shared/lib/block/Block';
import template from './HomePage.hbs?raw';
import './HomePage.css';
import { routerInstance } from '../../shared/lib/router/Router';
import { authStore } from '../../shared/store/authStore';
import { 
  fetchMovies, 
  fetchGenres, 
  fetchRecommendations, 
  markNotInterested
} from '../../features/catalog/catalogApi';
import { debounce } from '../../shared/utils/debounce';

export class HomePage extends Block {
  protected template = template;
  private loadMoviesDebounced: any;

  constructor() {
    super({
      isLoadingHero: true,
      featuredMovie: null,
      recs: null,
      showRecommendations: false,
      
      dynamicGenres: ['Todas'],
      selectedGenre: 'Todas',
      searchQuery: '',
      
      movies: [],
      totalMovies: 0,
      isLoadingCatalog: true,
      isFetchingMore: false,
      hasMovies: false,
      hasMore: false,
      page: 1,
      fetchError: null,
      
      skeletons: Array(12).fill({})
    });

    this.loadMoviesDebounced = debounce(this.loadMovies.bind(this), 350);
  }

  protected async componentDidMount() {
    const urlParams = new URLSearchParams(window.location.search);
    const q = urlParams.get('q') || '';
    const genre = urlParams.get('genre') || 'Todas';
    this.setProps({ searchQuery: q, selectedGenre: genre });

    this.fetchFeaturedHero();
    this.fetchGenres();
    this.fetchRecs();
    
    await this.loadMovies(1, true, q, genre);

    authStore.on('changed', () => {
      this.fetchRecs();
    });
  }

  private async fetchFeaturedHero() {
    try {
      const data = await fetchMovies(1, 1);
      if (data.items && data.items.length > 0) {
        const movie = data.items[0];
        this.setProps({ 
          featuredMovie: {
            ...movie,
            upperTitle: movie.title.toUpperCase()
          },
          isLoadingHero: false 
        });
      }
    } catch (err) {
      this.setProps({ isLoadingHero: false });
    }
  }

  private async fetchGenres() {
    const dbGenres = await fetchGenres();
    if (dbGenres.length > 0) {
      this.setProps({ dynamicGenres: ['Todas', ...dbGenres] });
    }
  }

  private async fetchRecs() {
    const state = authStore.getState();
    if (!state.isAuthenticated || !state.user) {
      this.setProps({ showRecommendations: false, recs: null });
      return;
    }

    try {
      const recs = await fetchRecommendations(state.user.id);
      if (recs && recs.items && recs.items.length > 0) {
        const mappedItems = recs.items.map(i => ({
          ...i,
          shortReason: this.getShortReason(i.reason)
        }));
        this.setProps({ 
          recs: { ...recs, items: mappedItems }, 
          showRecommendations: true 
        });
      } else {
        this.setProps({ showRecommendations: false });
      }
    } catch (err) {
      this.setProps({ showRecommendations: false });
    }
  }

  private getShortReason(longReason: string) {
    if (longReason.includes('género que calificaste')) return '⭐ Por tu actividad';
    if (longReason.includes('Quiero ver')) return '🎬 Por tu Watchlist';
    if (longReason.includes('géneros favoritos')) return '🎭 Porque te gusta';
    if (longReason.includes('tendencia')) return '🔥 Tendencia';
    return 'Recomendada';
  }

  private async loadMovies(pageNumber: number, isInitial: boolean, searchQ: string, genreQ: string) {
    if (isInitial) {
      this.setProps({ isLoadingCatalog: true, fetchError: null });
    } else {
      this.setProps({ isFetchingMore: true });
    }

    try {
      const data = await fetchMovies(pageNumber, 12, searchQ, genreQ);
      
      let newMovies = isInitial ? data.items : [...this.props.movies, ...data.items];
      
      newMovies = newMovies.map(m => {
        const hours = Math.floor(m.duration_minutes / 60);
        const mins = m.duration_minutes % 60;
        return {
          ...m,
          genreString: m.genres && m.genres.length > 0 ? m.genres.slice(0, 2).join(' / ') : 'General',
          durationString: `${hours}h ${mins}m`
        };
      });

      this.setProps({
        movies: newMovies,
        totalMovies: data.total,
        hasMovies: newMovies.length > 0,
        hasMore: data.page < data.pages,
        page: pageNumber
      });
    } catch (err: any) {
      this.setProps({ fetchError: 'Error al conectar con la cartelera. Por favor intenta de nuevo.' });
    } finally {
      this.setProps({ isLoadingCatalog: false, isFetchingMore: false });
    }
  }

  public updateUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const q = urlParams.get('q') || '';
    const genre = urlParams.get('genre') || 'Todas';
    
    if (q !== this.props.searchQuery || genre !== this.props.selectedGenre) {
      this.setProps({ searchQuery: q, selectedGenre: genre, page: 1 });
      this.loadMoviesDebounced(1, true, q, genre);
    }
  }

  protected events = {
    change: (e: Event) => {
      const target = e.target as HTMLSelectElement;
      if (target.id === 'genre-select') {
        const genre = target.value;
        this.setProps({ selectedGenre: genre, page: 1 });
        
        const newParams = new URLSearchParams(window.location.search);
        if (genre !== 'Todas') newParams.set('genre', genre);
        else newParams.delete('genre');
        
        const newUrl = newParams.toString() ? `/home?${newParams.toString()}` : `/home`;
        window.history.pushState({}, '', newUrl);
        
        this.loadMoviesDebounced(1, true, this.props.searchQuery, genre);
      }
    },
    click: async (e: Event) => {
      const target = e.target as HTMLElement;

      const navigateElement = target.closest('[data-navigate]');
      if (navigateElement) {
        const path = navigateElement.getAttribute('data-navigate');
        if (path) routerInstance.go(path);
        return;
      }

      if (target.id === 'load-more-btn') {
        if (this.props.isFetchingMore) return;
        const nextPage = this.props.page + 1;
        this.setProps({ page: nextPage });
        this.loadMovies(nextPage, false, this.props.searchQuery, this.props.selectedGenre);
        return;
      }

      if (target.id === 'clear-filters-btn') {
        this.setProps({ selectedGenre: 'Todas', searchQuery: '', page: 1 });
        window.history.pushState({}, '', '/home');
        this.loadMoviesDebounced(1, true, '', 'Todas');
        return;
      }

      if (target.id === 'retry-btn') {
        this.loadMovies(1, true, this.props.searchQuery, this.props.selectedGenre);
        return;
      }

      const dismissBtn = target.closest('.dismiss-btn');
      if (dismissBtn) {
        e.stopPropagation();
        e.preventDefault();
        const movieId = dismissBtn.getAttribute('data-dismiss');
        const state = authStore.getState();
        if (movieId && state.user) {
          try {
            await markNotInterested(movieId, state.user.id);
            const newRecs = { ...this.props.recs };
            newRecs.items = newRecs.items.filter((i: any) => i.id !== movieId);
            this.setProps({ 
              recs: newRecs,
              showRecommendations: newRecs.items.length > 0 
            });
          } catch (err) {
            console.error("Error al descartar película");
          }
        }
        return;
      }

      if (target.closest('#recs-prev')) {
        const carousel = this.element?.querySelector('#recs-carousel');
        if (carousel) carousel.scrollBy({ left: -300, behavior: 'smooth' });
        return;
      }
      if (target.closest('#recs-next')) {
        const carousel = this.element?.querySelector('#recs-carousel');
        if (carousel) carousel.scrollBy({ left: 300, behavior: 'smooth' });
        return;
      }
    }
  };
}