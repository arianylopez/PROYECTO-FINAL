import Block from '../../shared/lib/block/Block';
import template from './HomePage.hbs?raw';
import './HomePage.css';
import { FeaturedHero } from '../../widgets/featured-hero/FeaturedHero';
import { MovieCatalog } from '../../widgets/movie-catalog/MovieCatalog';

export class HomePage extends Block {
  protected template = template;

  protected componentDidMount() {
    const heroSlot = this.element?.querySelector('#hero-slot');
    const catalogSlot = this.element?.querySelector('#catalog-slot');

    if (heroSlot) {
      const hero = new FeaturedHero();
      heroSlot.replaceWith(hero.getContent()!);
      hero.dispatchComponentDidMount();
    }

    if (catalogSlot) {
      const catalog = new MovieCatalog();
      catalogSlot.replaceWith(catalog.getContent()!);
      catalog.dispatchComponentDidMount();
    }
  }
}