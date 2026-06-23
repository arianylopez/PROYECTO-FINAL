import Block from '../../shared/lib/block/Block';
import template from './MovieDetailPage.hbs?raw';
import './MovieDetailPage.css';
import { Header } from '../../widgets/header/Header';
import { Footer } from '../../widgets/footer/Footer';
import { catalogApi } from '../../shared/api/catalogApi';
import { ReviewsList } from '../../widgets/reviews-list/ReviewsList'

export class MovieDetailPage extends Block {
  protected template = template;

  protected async componentDidMount() {
    const headerSlot = this.element?.querySelector('#header-slot');
    const footerSlot = this.element?.querySelector('#footer-slot');

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

    const movieId = window.location.pathname.split('/').pop();

    if (movieId) {
      try {
        const movie = await catalogApi.getMovieById(movieId);
        this.setProps({ movie });

        const reviewsSlot = this.element?.querySelector('#reviews-slot');
        if (reviewsSlot) {
          const reviews = new ReviewsList({ movieId });
          reviewsSlot.replaceWith(reviews.getContent()!);
          reviews.dispatchComponentDidMount();
        }
      } catch (error) {
        this.setProps({ error: true });
      }
    }
  }
}