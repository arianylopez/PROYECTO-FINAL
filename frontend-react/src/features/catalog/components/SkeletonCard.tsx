export const SkeletonCard = () => {
  return (
    <div className="movie-card skeleton-card">
      <div className="movie-card__image-wrapper skeleton-card__image"></div>
      <div className="movie-card__info">
        <div className="skeleton-card__text skeleton-card__title"></div>
        <div className="skeleton-card__text skeleton-card__meta"></div>
        <div className="skeleton-card__text skeleton-card__details"></div>
        <div className="skeleton-card__button"></div>
      </div>
    </div>
  );
};
