import Block from '../../shared/lib/block/Block';
import template from './MovieDetailPage.hbs?raw';
import './MovieDetailPage.css';
import { routerInstance } from '../../shared/lib/router/Router';
import { authStore } from '../../shared/store/authStore';
import {
  fetchMovieDetail,
  fetchMovieReviews,
  fetchWatchlistStatus,
  toggleWatchlist,
  submitMovieRating,
  submitMovieReview,
  type ReviewsResponse,
  type Review
} from '../../features/catalog/catalogApi';

export class MovieDetailPage extends Block {
  protected template = template;
  private movieId: string = '';
  private _rating: number = 0;

  constructor(props = {}) {
    super({
      ...props,
      isMovieLoading: true,
      error: false,
      movie: null,
      isWatchlisted: false,
      
      reviewsData: null,
      reviewsStats: null,
      filteredReviews: [],
      reviewFilter: 'ALL',
      
      isSubmitting: false,
      reviewErrorMsg: '',
      user: null,
      reviewTextLength: 0
    });
  }

  protected async componentDidMount() {
    const parts = window.location.pathname.split('/');
    this.movieId = parts[parts.length - 1];

    if (!this.movieId) {
      this.setProps({ isMovieLoading: false, error: true });
      return;
    }

    const state = authStore.getState();
    this.setProps({ user: state.user });

    try {
      const movieData = await fetchMovieDetail(this.movieId);
      const revData = await fetchMovieReviews(this.movieId);
      
      this.setProps({ 
        movie: {
          ...movieData,
          duration_hours: Math.floor(movieData.duration_minutes / 60),
          duration_mins: movieData.duration_minutes % 60
        },
        reviewsData: revData,
        reviewsStats: this.computeReviewStats(revData),
        filteredReviews: this.computeFilteredReviews(revData.reviews, 'ALL'),
        formStarsHtml: this.generateFormStarsHtml(0, 0)
      });

      if (state.user) {
        const status = await fetchWatchlistStatus(this.movieId, state.user.id);
        this.setProps({ isWatchlisted: status });
      }

    } catch (err) {
      this.setProps({ error: true });
    } finally {
      this.setProps({ isMovieLoading: false });
    }

    authStore.on('changed', (newState: any) => {
      this.setProps({ user: newState.user });
      if (newState.user) {
        fetchWatchlistStatus(this.movieId, newState.user.id).then(status => {
          this.setProps({ isWatchlisted: status });
        });
      }
    });
  }

  private computeReviewStats(data: ReviewsResponse) {
    if (!data || data.stats.total_ratings === 0) {
      return {
        avg_score_formatted: '0.0',
        total_ratings: 0,
        posPct: 0, neuPct: 0, negPct: 0,
        total_pos: 0, total_neu: 0, total_neg: 0, total_all: 0,
        sentiment_label: 'Sin Calificaciones',
        stars_html: this.generateStarsHtml(0)
      };
    }

    const s = data.stats;
    const posPct = Math.round((s.positive / s.total_ratings) * 100);
    const neuPct = Math.round((s.neutral / s.total_ratings) * 100);
    const negPct = Math.round((s.negative / s.total_ratings) * 100);

    let label = 'Desfavorable';
    if (s.avg_score >= 4.5) label = 'Aclamación Universal';
    else if (s.avg_score >= 3.5) label = 'Favorable';
    else if (s.avg_score >= 2.5) label = 'Mixta';

    return {
      avg_score_formatted: s.avg_score.toFixed(1),
      total_ratings: s.total_ratings,
      posPct, neuPct, negPct,
      total_pos: s.positive,
      total_neu: s.neutral,
      total_neg: s.negative,
      total_all: s.total_ratings,
      sentiment_label: label,
      stars_html: this.generateStarsHtml(Math.round(s.avg_score))
    };
  }

  private computeFilteredReviews(reviews: Review[], filter: string) {
    const filtered = reviews.filter(r => {
      if (filter === 'ALL') return true;
      if (filter === 'POSITIVE') return r.score >= 4;
      if (filter === 'NEUTRAL') return r.score === 3;
      if (filter === 'NEGATIVE') return r.score <= 2;
      return true;
    });

    return filtered.map(r => {
      const isLong = r.text && r.text.length > 180;
      return {
        ...r,
        first_letter: r.user_name.charAt(0).toUpperCase(),
        formatted_date: new Date(r.date).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }),
        stars_html: this.generateStarsHtml(r.score, 16),
        isLong,
        expanded: false,
        display_text: isLong ? `${r.text.slice(0, 180)}...` : r.text
      };
    });
  }

  private generateStarsHtml(score: number, size: number = 22) {
    let html = '';
    for (let i = 1; i <= 5; i++) {
      const fill = i <= score ? 'currentColor' : 'none';
      html += `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${fill}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
      </svg>`;
    }
    return html;
  }

  private generateFormStarsHtml(rating: number, hover: number) {
    let html = '';
    for (let i = 1; i <= 5; i++) {
      const active = (hover || rating) >= i;
      const color = active ? '#f4e951' : '#374151';
      const fill = active ? 'currentColor' : 'none';
      html += `
        <button type="button" class="star-btn" data-star="${i}" style="color: ${color}">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="${fill}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
          </svg>
        </button>
      `;
    }
    return html;
  }

  private updateStarsDOM(rating: number, hover: number) {
    const stars = this.element?.querySelectorAll('.star-btn');
    if (!stars) return;
    
    stars.forEach((starBtn) => {
      const i = parseInt(starBtn.getAttribute('data-star') || '0', 10);
      const active = (hover || rating) >= i;
      const color = active ? '#f4e951' : '#374151';
      const fill = active ? 'currentColor' : 'none';
      
      (starBtn as HTMLElement).style.color = color;
      const svg = starBtn.querySelector('svg');
      if (svg) {
        svg.setAttribute('fill', fill);
      }
    });
  }

  protected events = {
    click: async (e: Event) => {
      const target = e.target as HTMLElement;

      const starBtn = target.closest('.star-btn');
      if (starBtn) {
        const star = parseInt(starBtn.getAttribute('data-star') || '0', 10);
        this._rating = star;
        this.updateStarsDOM(star, 0);
        return;
      }

      if (target.id === 'btn-buy-ticket') {
        if (!this.props.user) {
          routerInstance.go(`/login`);
        } else {
          routerInstance.go(`/movie/${this.movieId}/screenings`);
        }
        return;
      }

      const watchlistBtn = target.closest('#btn-watchlist');
      if (watchlistBtn) {
        if (!this.props.user) {
          routerInstance.go(`/login`);
          return;
        }
        try {
          const newStatus = await toggleWatchlist(this.movieId, this.props.user.id, this.props.movie.title, this.props.movie.poster_url);
          this.setProps({ isWatchlisted: newStatus });
        } catch (err) {
          alert("Error al actualizar tu lista.");
        }
        return;
      }

      if (target.classList.contains('review-filter-btn')) {
        const filter = target.getAttribute('data-filter') || 'ALL';
        this.setProps({
          reviewFilter: filter,
          filteredReviews: this.computeFilteredReviews(this.props.reviewsData.reviews, filter)
        });
        return;
      }

      if (target.classList.contains('review-card__more-btn')) {
        const id = target.getAttribute('data-review-id');
        const newReviews = this.props.filteredReviews.map((r: any) => {
          if (r.id === id) {
            const expanded = !r.expanded;
            return {
              ...r,
              expanded,
              display_text: expanded ? r.text : `${r.text.slice(0, 180)}...`
            };
          }
          return r;
        });
        this.setProps({ filteredReviews: newReviews });
        return;
      }

      if (target.id === 'login-prompt-btn') {
        routerInstance.go('/login');
        return;
      }
    },

    submit: async (e: Event) => {
      const form = e.target as HTMLFormElement;
      if (form.id === 'review-form') {
        e.preventDefault();
        
        if (this._rating === 0) {
          this.setProps({ reviewErrorMsg: "Debes calificar la película antes de escribir una reseña." });
          return;
        }
        this.setProps({ isSubmitting: true, reviewErrorMsg: '' });
        
        const textarea = this.element?.querySelector('#review-textarea') as HTMLTextAreaElement;
        const reviewText = textarea ? textarea.value : '';

        try {
          await submitMovieRating(this.movieId, this.props.user.id, this.props.user.name || 'Usuario', this._rating);
          if (reviewText.trim().length > 0) {
            await submitMovieReview(this.movieId, this.props.user.id, this.props.user.name || 'Usuario', reviewText.trim());
          }
          
          const updatedReviews = await fetchMovieReviews(this.movieId);
          this._rating = 0;
          this.setProps({
            reviewsData: updatedReviews,
            reviewsStats: this.computeReviewStats(updatedReviews),
            filteredReviews: this.computeFilteredReviews(updatedReviews.reviews, this.props.reviewFilter),
            reviewTextLength: 0,
            formStarsHtml: this.generateFormStarsHtml(0, 0),
            isSubmitting: false
          });
        } catch (err: any) {
          this.setProps({
            reviewErrorMsg: err?.response?.data?.detail || "Ocurrió un error al guardar tu reseña.",
            isSubmitting: false
          });
        }
      }
    },

    mouseover: (e: Event) => {
      const target = e.target as HTMLElement;
      const starBtn = target.closest('.star-btn');
      if (starBtn) {
        const star = parseInt(starBtn.getAttribute('data-star') || '0', 10);
        this.updateStarsDOM(this._rating, star);
      }
    },

    mouseout: (e: Event) => {
      const target = e.target as HTMLElement;
      const starBtn = target.closest('.star-btn');
      if (starBtn) {
        this.updateStarsDOM(this._rating, 0);
      }
    },

    input: (e: Event) => {
      const target = e.target as HTMLTextAreaElement;
      if (target.id === 'review-textarea') {
        const countSpan = this.element?.querySelector('#review-char-count');
        if (countSpan) countSpan.textContent = target.value.length.toString();
      }
    }
  };
}