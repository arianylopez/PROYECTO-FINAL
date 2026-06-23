import Block from '../../shared/lib/block/Block';
import template from './HomePage.hbs?raw';
import './HomePage.css';
import { Header } from '../../widgets/header/Header';
import { Footer } from '../../widgets/footer/Footer';
import { FeaturedHero } from '../../widgets/featured-hero/FeaturedHero';
import { MovieCatalog } from '../../widgets/movie-catalog/MovieCatalog';

export class HomePage extends Block {
  protected template = template;

  protected componentDidMount() {
    const headerSlot = this.element?.querySelector('#header-slot');
    const footerSlot = this.element?.querySelector('#footer-slot');
    const heroSlot = this.element?.querySelector('#hero-slot');
    const catalogSlot = this.element?.querySelector('#catalog-slot');

    if (headerSlot) {
      const header = new Header();
      headerSlot.replaceWith(header.getContent()!);
      header.dispatchComponentDidMount();
    }

    if (footerSlot) {
      const footer = new Footer();
      footerSlot.replaceWith(footer.getContent()!);
      footer.dispatchComponentDidMount();
    }

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