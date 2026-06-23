import Block from '../../shared/lib/block/Block';
import template from './ReviewsList.hbs?raw';
import './ReviewsList.css';
import { ugcApi } from '../../shared/api/ugcApi';

export class ReviewsList extends Block {
  protected template = template;

  protected async componentDidMount() {
    try {
      const movieId = this.props.movieId;
      if (movieId) {
        const data = await ugcApi.getReviews(movieId);
        this.setProps({ reviews: data.results || data });
      }
    } catch (error) {
      this.setProps({ reviews: [] });
    }
  }
}