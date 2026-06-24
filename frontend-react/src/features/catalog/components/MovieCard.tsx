import type { Movie } from '../catalogApi';
import { useNavigate } from 'react-router-dom';

interface MovieCardProps {
  movie: Movie;
}

export const MovieCard = ({ movie }: MovieCardProps) => {
  const navigate = useNavigate();
  const hours = Math.floor(movie.duration_minutes / 60);
  const minutes = movie.duration_minutes % 60;
  const friendlyDuration = `${hours}h ${minutes}m`;

  return (
    <div
      className="movie-card"
      onClick={() => navigate(`/movie/${movie.id}`)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') navigate(`/movie/${movie.id}`);
      }}
      role="button"
      tabIndex={0}
      style={{ cursor: 'pointer' }}
    >
      <div className="movie-card__image-wrapper">
        <div className="movie-card__badge-rating">{movie.rating_classification}</div>

        <img
          src={movie.poster_url}
          alt={`Afiche publicitario de ${movie.title}`}
          className="movie-card__image"
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src = 'https://via.placeholder.com/300x450/1c1f2a/ffffff?text=CinemaPlus';
          }}
        />

        <div className="movie-card__overlay">
          <p className="movie-card__overlay-synopsis">{movie.synopsis}</p>
          {movie.trailer_url && (
            <button
              className="movie-card__btn-trailer"
              onClick={() => window.open(movie.trailer_url, '_blank', 'noopener,noreferrer')}
            >
              Ver Tráiler Oficial
            </button>
          )}
        </div>
      </div>

      <div className="movie-card__info">
        <h3 className="movie-card__title" title={movie.title}>
          {movie.title}
        </h3>
        <span className="movie-card__genres">
          {movie.genres && movie.genres.length > 0 ? movie.genres.slice(0, 2).join(' / ') : 'General'}
        </span>

        <div className="movie-card__footer-meta">
          <div className="movie-card__duration">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            {friendlyDuration}
          </div>
          <div className="movie-card__formats-tags">
            <span className="movie-card__tag">2D</span>
            <span className="movie-card__tag">DUB</span>
          </div>
        </div>
      </div>
    </div>
  );
};
