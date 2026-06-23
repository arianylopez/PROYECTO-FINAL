import Block from '../../shared/lib/block/Block';
import template from './FeaturedHero.hbs?raw';
import './FeaturedHero.css';
import { catalogApi } from '../../shared/api/catalogApi';
import { routerInstance } from '../../shared/lib/router/Router';

export class FeaturedHero extends Block {
  protected template = template;

  protected events = {
    click: (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('featured-hero__button')) {
        const id = target.getAttribute('data-id');
        if (id) routerInstance.go(`/movie/${id}`);
      }
    },
  };

  protected async componentDidMount() {
    try {
      const featured = await catalogApi.getFeatured();
      this.setProps({ featured });
    } catch (error) {
      this.setProps({ featured: null });
    }
  }
}