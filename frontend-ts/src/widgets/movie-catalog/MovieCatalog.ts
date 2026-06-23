import Block from '../../shared/lib/block/Block';
import template from './MovieCatalog.hbs?raw';
import './MovieCatalog.css';
import { catalogApi } from '../../shared/api/catalogApi';
import { routerInstance } from '../../shared/lib/router/Router';

export class MovieCatalog extends Block {
  protected template = template;

  protected events = {
    click: (e: Event) => {
      const target = e.target as HTMLElement;
      const card = target.closest('.movie-card');
      if (card) {
        const id = card.getAttribute('data-id');
        if (id) routerInstance.go(`/movie/${id}`);
      }
    },
  };

  protected async componentDidMount() {
    try {
      const movies = await catalogApi.getMovies(1, 12);
      this.setProps({ movies });
    } catch (error) {
      this.setProps({ movies: [] });
    }
  }
}