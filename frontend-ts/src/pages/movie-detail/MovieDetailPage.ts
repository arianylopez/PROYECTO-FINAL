import Block from '../../shared/lib/block/Block';
import template from './MovieDetailPage.hbs?raw';
import './MovieDetailPage.css';
import { catalogApi } from '../../shared/api/catalogApi';
import { ReviewsList } from '../../widgets/reviews-list/ReviewsList'

export class MovieDetailPage extends Block {
  protected template = template;

  protected async componentDidMount() {
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