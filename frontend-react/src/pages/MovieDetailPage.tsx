import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  fetchMovieDetail, 
  fetchMovieReviews, 
  submitMovieRating, 
  submitMovieReview,
  fetchWatchlistStatus, 
  toggleWatchlist,
  type MovieDetail, 
  type Review, 
  type ReviewsResponse 
} from '../features/catalog/catalogApi';
import { useAuthStore } from '../shared/store/authStore';
import './MovieDetail.css';

interface StarRatingProps {
  value: number;
  hover: number;
  onRate: (val: number) => void;
  onHover: (val: number) => void;
}

const StarRatingInput: React.FC<StarRatingProps> = ({ value, hover, onRate, onHover }) => {
  return (
    <div className="star-rating" role="radiogroup" aria-label="Calificar película">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          type="button"
          key={star}
          role="radio"
          aria-checked={value === star}
          aria-label={`${star} estrellas`}
          tabIndex={0}
          onMouseEnter={() => onHover(star)}
          onMouseLeave={() => onHover(0)}
          onClick={() => onRate(star)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onRate(star); }}
          className={`star-rating__btn ${(hover || value) >= star ? 'star-rating__btn--active' : 'star-rating__btn--inactive'}`}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill={(hover || value) >= star ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
          </svg>
        </button>
      ))}
    </div>
  );
};

const ReviewCard = ({ review }: { review: Review }) => {
  const [expanded, setExpanded] = useState(false);
  const textLimit = 180;
  const isLong = review.text && review.text.length > textLimit;

  return (
    <div className="review-card">
      <div className="review-card__header">
        <div className="review-card__user-info">
          <div className="review-card__avatar">
            {review.user_name.charAt(0).toUpperCase()}
          </div>
          <div className="review-card__user-details">
            <div className="review-card__username">{review.user_name}</div>
            <div className="review-card__date">{new Date(review.date).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
          </div>
        </div>
        <div className="review-card__stars">
          {[1, 2, 3, 4, 5].map(i => (
             <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill={i <= review.score ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
          ))}
        </div>
      </div>
      {review.text && (
        <p className="review-card__text">
          {expanded || !isLong ? review.text : `${review.text.slice(0, textLimit)}...`}
          {isLong && (
            <button onClick={() => setExpanded(!expanded)} className="review-card__toggle">
              {expanded ? ' Ver menos' : ' Leer más'}
            </button>
          )}
        </p>
      )}
    </div>
  );
};

export const MovieDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();

  const [movie, setMovie] = useState<MovieDetail | null>(null);
  const [isMovieLoading, setIsMovieLoading] = useState(true);
  const [error, setError] = useState(false);

  const [reviewsData, setReviewsData] = useState<ReviewsResponse | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE'>('ALL');
  
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [isWatchlisted, setIsWatchlisted] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        if (!id) return;
        const movieData = await fetchMovieDetail(id);
        setMovie(movieData);
        
        const revData = await fetchMovieReviews(id);
        setReviewsData(revData);
      } catch (err) {
        console.error("Error cargando detalles", err);
        setError(true);
      } finally {
        setIsMovieLoading(false);
      }
    };
    loadData();
  }, [id]);

  useEffect(() => {
    if (user && id) {
      fetchWatchlistStatus(id, user.id).then(status => setIsWatchlisted(status)).catch(console.error);
    }
  }, [user, id]);

  const handleBuyTicket = () => {
    if (!user) {
      navigate(`/login?redirect=/movie/${movie?.id}/screenings`);
    } else {
      navigate(`/movie/${movie?.id}/screenings`);
    }
  };

  const handleToggleWatchlist = async () => {
    if (!user) return navigate(`/login?redirect=${location.pathname}`);
    if (!movie || !id) return;
    try {
      const newStatus = await toggleWatchlist(id, user.id, movie.title, movie.poster_url);
      setIsWatchlisted(newStatus);
    } catch (err) {
      alert("Error al actualizar tu lista.");
    }
  };

  const posPct = useMemo(() => {
    if (!reviewsData || reviewsData.stats.total_ratings === 0) return 0;
    return Math.round((reviewsData.stats.positive / reviewsData.stats.total_ratings) * 100);
  }, [reviewsData]);

  const neuPct = useMemo(() => {
    if (!reviewsData || reviewsData.stats.total_ratings === 0) return 0;
    return Math.round((reviewsData.stats.neutral / reviewsData.stats.total_ratings) * 100);
  }, [reviewsData]);

  const negPct = useMemo(() => {
    if (!reviewsData || reviewsData.stats.total_ratings === 0) return 0;
    return Math.round((reviewsData.stats.negative / reviewsData.stats.total_ratings) * 100);
  }, [reviewsData]);

  const filteredReviews = useMemo(() => {
    if (!reviewsData) return [];
    return reviewsData.reviews.filter(r => {
      if (filter === 'ALL') return true;
      if (filter === 'POSITIVE') return r.score >= 4;
      if (filter === 'NEUTRAL') return r.score === 3;
      if (filter === 'NEGATIVE') return r.score <= 2;
      return true;
    });
  }, [reviewsData, filter]);

  const getSentimentLabel = (avg: number) => {
    if (avg === 0) return 'Sin Calificaciones';
    if (avg >= 4.5) return 'Aclamación Universal';
    if (avg >= 3.5) return 'Favorable';
    if (avg >= 2.5) return 'Mixta';
    return 'Desfavorable';
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return navigate(`/login?redirect=${location.pathname}`);
    if (rating === 0) return setErrorMsg("Debes calificar la película antes de escribir una reseña.");
    if (!id) return;

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      await submitMovieRating(id, user.id, user.name || 'Usuario', rating);
      if (reviewText.trim().length > 0) {
        await submitMovieReview(id, user.id, user.name || 'Usuario', reviewText.trim());
      }
      
      setReviewText('');
      const updatedReviews = await fetchMovieReviews(id);
      setReviewsData(updatedReviews);
    } catch (err: unknown) {
      const errorResponse = err as { response?: { data?: { detail?: string } } };
      setErrorMsg(errorResponse.response?.data?.detail || "Ocurrió un error al guardar tu reseña.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isMovieLoading) return <div className="movie-detail__loading">Cargando película...</div>;
  if (error || !movie) return <div className="movie-detail__error">Película no encontrada o error de conexión.</div>;

  return (
    <div className="movie-detail">
      
      <div className="movie-detail__hero">
        <div className="movie-detail__hero-bg" style={{ backgroundImage: `url(${movie.poster_url})` }}></div>
        <div className="movie-detail__hero-content">
          <img src={movie.poster_url} alt={movie.title} className="movie-detail__poster" />
          <div className="movie-detail__info">
            <h1 className="movie-detail__title">{movie.title}</h1>
            
            <div className="movie-detail__meta">
              <span className="movie-detail__meta-item">{movie.director}</span>
              <span className="movie-detail__meta-dot">•</span>
              <span className="movie-detail__meta-item">{Math.floor(movie.duration_minutes / 60)}h {movie.duration_minutes % 60}m</span>
              <span className="movie-detail__meta-dot">•</span>
              <span className="movie-detail__meta-badge">{movie.rating_classification}</span>
            </div>

            <div className="movie-detail__genres">
              {movie.genres?.map((g: string) => (
                <span key={g} className="movie-detail__genre">{g}</span>
              ))}
            </div>

            <p className="movie-detail__synopsis">{movie.synopsis}</p>
            
            <div className="movie-detail__actions">
              <button 
                onClick={handleBuyTicket}
                className="movie-detail__btn"
              >
                Comprar entradas
              </button>

              <button 
                onClick={handleToggleWatchlist}
                className={`movie-detail__btn--secondary ${isWatchlisted ? 'active' : ''}`}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill={isWatchlisted ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                </svg>
                {isWatchlisted ? 'En Mi Lista' : 'Añadir a Mi Lista'}
              </button>
            </div>

          </div>
        </div>
      </div>

      <div className="reviews-section">
        <h2 className="reviews-section__title">Opiniones de la Audiencia</h2>
        
        <div className="reviews-section__container">
          
          <div className="reviews-section__summary">
            
            <div className="reviews-section__stats">
              <div className="reviews-section__stats-score">
                {reviewsData?.stats.avg_score.toFixed(1) || '0.0'}
              </div>
              <div className="reviews-section__stats-stars">
                {[1, 2, 3, 4, 5].map(i => (
                  <svg key={i} width="22" height="22" viewBox="0 0 24 24" fill={i <= Math.round(reviewsData?.stats.avg_score || 0) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                  </svg>
                ))}
              </div>
              <div className="reviews-section__stats-label">
                {getSentimentLabel(reviewsData?.stats.avg_score || 0)}
              </div>
              <div className="reviews-section__stats-total">Basado en {reviewsData?.stats.total_ratings || 0} calificaciones</div>
            </div>

            <div className="reviews-section__bars">
              
              <div className="reviews-section__bar-row">
                <span className="reviews-section__bar-label">Positivas</span>
                <div className="reviews-section__bar-track">
                  <div className="reviews-section__bar-fill reviews-section__bar-fill--pos" style={{ width: `${posPct}%` }}></div>
                </div>
                <span className="reviews-section__bar-pct">{posPct}%</span>
              </div>
              
              <div className="reviews-section__bar-row">
                <span className="reviews-section__bar-label">Neutrales</span>
                <div className="reviews-section__bar-track">
                  <div className="reviews-section__bar-fill reviews-section__bar-fill--neu" style={{ width: `${neuPct}%` }}></div>
                </div>
                <span className="reviews-section__bar-pct">{neuPct}%</span>
              </div>
              
              <div className="reviews-section__bar-row">
                <span className="reviews-section__bar-label">Negativas</span>
                <div className="reviews-section__bar-track">
                  <div className="reviews-section__bar-fill reviews-section__bar-fill--neg" style={{ width: `${negPct}%` }}></div>
                </div>
                <span className="reviews-section__bar-pct">{negPct}%</span>
              </div>

            </div>
          </div>

          <div className="reviews-section__form-container">
            <h3 className="reviews-section__form-title">Comparte tu experiencia</h3>
            
            {!user ? (
              <div className="reviews-section__form-login">
                <p>Debes iniciar sesión para calificar y publicar una reseña.</p>
                <button onClick={() => navigate(`/login?redirect=${location.pathname}`)} className="reviews-section__form-btn">
                  Iniciar Sesión
                </button>
              </div>
            ) : (
              <form onSubmit={handleReviewSubmit} className="reviews-section__form">
                {errorMsg && (
                  <div className="reviews-section__form-error">
                    ⚠️ {errorMsg}
                  </div>
                )}
                
                <div className="reviews-section__form-group">
                  <p className="reviews-section__form-label">Tu Calificación <span>*</span></p>
                  <StarRatingInput value={rating} hover={hoverRating} onRate={setRating} onHover={setHoverRating} />
                </div>

                <div className="reviews-section__form-group">
                  <label className="reviews-section__form-label" htmlFor="reviewText">Tu Reseña <span className="optional">(Opcional)</span></label>
                  <textarea 
                    id="reviewText"
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="¿Qué te pareció la película? Escribe tu opinión aquí..."
                    maxLength={500}
                    rows={4}
                    className="reviews-section__form-textarea"
                  />
                  <div className="reviews-section__form-count">
                    {reviewText.length} / 500
                  </div>
                </div>

                <div className="reviews-section__form-actions">
                  <button 
                    type="submit" 
                    disabled={isSubmitting || rating === 0}
                    className="reviews-section__form-submit"
                  >
                    {isSubmitting ? 'Procesando...' : 'Publicar'}
                  </button>
                </div>
              </form>
            )}
          </div>

          <div>
            <div className="reviews-section__filters">
              <button onClick={() => setFilter('ALL')} className={`reviews-section__filter-btn ${filter === 'ALL' ? 'reviews-section__filter-btn--active' : ''}`}>Todas ({reviewsData?.reviews.length || 0})</button>
              <button onClick={() => setFilter('POSITIVE')} className={`reviews-section__filter-btn ${filter === 'POSITIVE' ? 'reviews-section__filter-btn--active' : ''}`}>Positivas ({reviewsData?.stats.positive || 0})</button>
              <button onClick={() => setFilter('NEUTRAL')} className={`reviews-section__filter-btn ${filter === 'NEUTRAL' ? 'reviews-section__filter-btn--active' : ''}`}>Neutrales ({reviewsData?.stats.neutral || 0})</button>
              <button onClick={() => setFilter('NEGATIVE')} className={`reviews-section__filter-btn ${filter === 'NEGATIVE' ? 'reviews-section__filter-btn--active' : ''}`}>Negativas ({reviewsData?.stats.negative || 0})</button>
            </div>

            {filteredReviews.length === 0 ? (
              <div className="reviews-section__empty">
                No hay reseñas escritas en esta categoría.
              </div>
            ) : (
              <div className="reviews-section__grid">
                {filteredReviews.map(r => <ReviewCard key={r.id} review={r} />)}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};