import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  fetchMovieDetail, 
  fetchMovieReviews, 
  submitMovieRating, 
  submitMovieReview, 
  type MovieDetail,
  type Review, 
  type ReviewsResponse 
} from '../features/catalog/catalogApi';
import { useAuthStore } from '../shared/store/authStore';

interface StarRatingProps {
  value: number;
  hover: number;
  onRate: (val: number) => void;
  onHover: (val: number) => void;
}

const StarRatingInput: React.FC<StarRatingProps> = ({ value, hover, onRate, onHover }) => {
  return (
    <div style={{ display: 'flex', gap: '0.4rem' }} role="radiogroup" aria-label="Calificar película">
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
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: '0.2rem',
            color: (hover || value) >= star ? '#f4e951' : '#374151',
            transition: 'color 0.2s', outline: 'none'
          }}
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
    <div style={{ backgroundColor: '#171a21', padding: '1.5rem', borderRadius: '12px', border: '1px solid #262932', display: 'flex', flexDirection: 'column', gap: '1rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: '#f4e951', color: '#0f1115', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '1.2rem' }}>
            {review.user_name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: '800', color: '#fff' }}>{review.user_name}</div>
            <div style={{ color: '#6b7280', fontSize: '0.8rem' }}>{new Date(review.date).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '2px', color: '#f4e951' }}>
          {[1, 2, 3, 4, 5].map(i => (
             <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill={i <= review.score ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
          ))}
        </div>
      </div>
      {review.text && (
        <p style={{ color: '#d1d5db', lineHeight: '1.6', fontSize: '0.95rem', margin: 0, whiteSpace: 'pre-wrap' }}>
          {expanded || !isLong ? review.text : `${review.text.slice(0, textLimit)}...`}
          {isLong && (
            <button onClick={() => setExpanded(!expanded)} style={{ background: 'none', border: 'none', color: '#f4e951', cursor: 'pointer', fontWeight: 'bold', marginLeft: '5px' }}>
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

  const handleBuyTicket = () => {
    if (!user) {
      navigate(`/login?redirect=/movie/${movie?.id}/screenings`);
    } else {
      navigate(`/movie/${movie?.id}/screenings`);
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

  if (isMovieLoading) return <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f1115', color: '#f4e951' }}>Cargando película...</div>;
  if (error || !movie) return <div style={{ minHeight: '100vh', backgroundColor: '#0f1115', color: '#fff', padding: '2rem', textAlign: 'center' }}>Película no encontrada o error de conexión.</div>;

  return (
    <div style={{ backgroundColor: '#0f1115', minHeight: '100vh', color: '#ffffff', fontFamily: '"Inter", system-ui, sans-serif' }}>
      
      <div style={{ position: 'relative', overflow: 'hidden', padding: '5rem 4%' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${movie.poster_url})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(40px) brightness(0.25)', zIndex: 0 }}></div>
        <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1, display: 'flex', flexWrap: 'wrap', gap: '4rem', alignItems: 'center' }}>
          <img src={movie.poster_url} alt={movie.title} style={{ width: '320px', borderRadius: '16px', boxShadow: '0 25px 50px rgba(0,0,0,0.8)' }} />
          <div style={{ flex: 1, minWidth: '300px' }}>
            <h1 style={{ fontSize: '3.5rem', fontWeight: '900', textTransform: 'uppercase', margin: '0 0 1rem 0', lineHeight: '1.1', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>{movie.title}</h1>
            
            <div style={{ display: 'flex', gap: '1rem', color: '#d1d5db', fontWeight: 'bold', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <span>{movie.director}</span>
              <span style={{ color: '#4b5563' }}>•</span>
              <span>{Math.floor(movie.duration_minutes / 60)}h {movie.duration_minutes % 60}m</span>
              <span style={{ color: '#4b5563' }}>•</span>
              <span style={{ border: '1px solid #4b5563', padding: '0.2rem 0.6rem', borderRadius: '6px', color: '#fff' }}>{movie.rating_classification}</span>
            </div>

            <div style={{ display: 'flex', gap: '0.8rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
              {movie.genres?.map((g: string) => (
                <span key={g} style={{ backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.4rem 1.2rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold', letterSpacing: '0.5px' }}>{g}</span>
              ))}
            </div>

            <p style={{ fontSize: '1.1rem', lineHeight: '1.7', color: '#9ca3af', marginBottom: '3rem', maxWidth: '800px' }}>{movie.synopsis}</p>
            
            <div style={{ display: 'flex', gap: '1.5rem', maxWidth: '500px' }}>
              <button 
                onClick={handleBuyTicket}
                style={{ flex: 1, backgroundColor: '#f4e951', color: '#0f1115', padding: '1.2rem', borderRadius: '8px', border: 'none', fontWeight: '900', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '1px', cursor: 'pointer', transition: 'background-color 0.2s', boxShadow: '0 10px 20px rgba(244,233,81,0.2)' }}
                onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#e2d73f'; }}
                onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#f4e951'; }}
              >
                Comprar entradas
              </button>

              <button 
                onClick={() => alert('Próximamente: Funcionalidad de Favoritos')}
                style={{ flex: 1, backgroundColor: 'transparent', color: '#ffffff', padding: '1.2rem', borderRadius: '8px', border: '1px solid #4b5563', fontWeight: '700', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.5px', cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseOver={(e) => { e.currentTarget.style.borderColor = '#ffffff'; e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; }}
                onMouseOut={(e) => { e.currentTarget.style.borderColor = '#4b5563'; e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                Añadir a Mi Lista
              </button>
            </div>

          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '4rem 4%' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: '900', textTransform: 'uppercase', marginBottom: '2rem', borderBottom: '2px solid #262932', paddingBottom: '1rem', display: 'inline-block' }}>Opiniones de la Audiencia</h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3rem', backgroundColor: '#171a21', padding: '2.5rem', borderRadius: '16px', border: '1px solid #262932', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
            
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: '220px', borderRight: '1px solid #374151', paddingRight: '3rem' }}>
              <div style={{ fontSize: '5rem', fontWeight: '900', color: '#fff', lineHeight: '1', textShadow: '0 4px 10px rgba(0,0,0,0.5)' }}>
                {reviewsData?.stats.avg_score.toFixed(1) || '0.0'}
              </div>
              <div style={{ display: 'flex', gap: '4px', color: '#f4e951', margin: '0.8rem 0 1rem' }}>
                {[1, 2, 3, 4, 5].map(i => (
                  <svg key={i} width="22" height="22" viewBox="0 0 24 24" fill={i <= Math.round(reviewsData?.stats.avg_score || 0) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                  </svg>
                ))}
              </div>
              <div style={{ color: '#fff', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.9rem', marginBottom: '0.4rem' }}>
                {getSentimentLabel(reviewsData?.stats.avg_score || 0)}
              </div>
              <div style={{ color: '#6b7280', fontSize: '0.85rem' }}>Basado en {reviewsData?.stats.total_ratings || 0} calificaciones</div>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.2rem', justifyContent: 'center', minWidth: '280px' }}>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ width: '90px', color: '#d1d5db', fontSize: '0.95rem', fontWeight: '700' }}>Positivas</span>
                <div style={{ flex: 1, height: '10px', backgroundColor: '#262932', borderRadius: '5px', overflow: 'hidden' }}>
                  <div style={{ width: `${posPct}%`, height: '100%', backgroundColor: '#4ade80', borderRadius: '5px', transition: 'width 0.5s ease-out' }}></div>
                </div>
                <span style={{ width: '45px', textAlign: 'right', color: '#9ca3af', fontSize: '0.9rem', fontWeight: 'bold' }}>{posPct}%</span>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ width: '90px', color: '#d1d5db', fontSize: '0.95rem', fontWeight: '700' }}>Neutrales</span>
                <div style={{ flex: 1, height: '10px', backgroundColor: '#262932', borderRadius: '5px', overflow: 'hidden' }}>
                  <div style={{ width: `${neuPct}%`, height: '100%', backgroundColor: '#facc15', borderRadius: '5px', transition: 'width 0.5s ease-out' }}></div>
                </div>
                <span style={{ width: '45px', textAlign: 'right', color: '#9ca3af', fontSize: '0.9rem', fontWeight: 'bold' }}>{neuPct}%</span>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ width: '90px', color: '#d1d5db', fontSize: '0.95rem', fontWeight: '700' }}>Negativas</span>
                <div style={{ flex: 1, height: '10px', backgroundColor: '#262932', borderRadius: '5px', overflow: 'hidden' }}>
                  <div style={{ width: `${negPct}%`, height: '100%', backgroundColor: '#f87171', borderRadius: '5px', transition: 'width 0.5s ease-out' }}></div>
                </div>
                <span style={{ width: '45px', textAlign: 'right', color: '#9ca3af', fontSize: '0.9rem', fontWeight: 'bold' }}>{negPct}%</span>
              </div>

            </div>
          </div>

          <div style={{ backgroundColor: '#1f222b', padding: '2.5rem', borderRadius: '16px', border: '1px solid #374151', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', backgroundColor: '#f4e951' }}></div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: '900', marginBottom: '1.5rem', color: '#fff' }}>Comparte tu experiencia</h3>
            
            {!user ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem', backgroundColor: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '12px' }}>
                <p style={{ color: '#9ca3af', margin: 0, fontSize: '1.05rem' }}>Debes iniciar sesión para calificar y publicar una reseña.</p>
                <button onClick={() => navigate(`/login?redirect=${location.pathname}`)} style={{ backgroundColor: '#f4e951', color: '#000', padding: '0.9rem 2.5rem', borderRadius: '30px', fontWeight: '900', border: 'none', cursor: 'pointer', textTransform: 'uppercase', fontSize: '0.9rem' }}>
                  Iniciar Sesión
                </button>
              </div>
            ) : (
              <form onSubmit={handleReviewSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.8rem' }}>
                {errorMsg && (
                  <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '1rem 1.5rem', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.3)', fontWeight: 'bold' }}>
                    ⚠️ {errorMsg}
                  </div>
                )}
                
                <div>
                  <label style={{ display: 'block', color: '#d1d5db', marginBottom: '0.8rem', fontWeight: '700', fontSize: '1.05rem' }}>Tu Calificación <span style={{ color: '#ef4444' }}>*</span></label>
                  <StarRatingInput value={rating} hover={hoverRating} onRate={setRating} onHover={setHoverRating} />
                </div>

                <div>
                  <label style={{ display: 'block', color: '#d1d5db', marginBottom: '0.8rem', fontWeight: '700', fontSize: '1.05rem' }}>Tu Reseña <span style={{ color: '#9ca3af', fontWeight: 'normal', fontSize: '0.9rem' }}>(Opcional)</span></label>
                  <textarea 
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="¿Qué te pareció la película? Escribe tu opinión aquí..."
                    maxLength={500}
                    rows={4}
                    style={{ width: '100%', backgroundColor: 'rgba(0,0,0,0.2)', border: '1px solid #374151', borderRadius: '12px', color: '#fff', padding: '1.2rem', fontFamily: 'inherit', resize: 'vertical', outline: 'none', fontSize: '1rem', lineHeight: '1.5' }}
                    onFocus={(e) => e.target.style.borderColor = '#f4e951'}
                    onBlur={(e) => e.target.style.borderColor = '#374151'}
                  />
                  <div style={{ textAlign: 'right', color: '#6b7280', fontSize: '0.85rem', marginTop: '0.5rem', fontWeight: '600' }}>
                    {reviewText.length} / 500
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button 
                    type="submit" 
                    disabled={isSubmitting || rating === 0}
                    style={{ backgroundColor: (rating === 0 || isSubmitting) ? '#374151' : '#f4e951', color: (rating === 0 || isSubmitting) ? '#9ca3af' : '#000', padding: '1rem 3rem', borderRadius: '30px', fontWeight: '900', textTransform: 'uppercase', border: 'none', cursor: (rating === 0 || isSubmitting) ? 'not-allowed' : 'pointer', transition: 'all 0.2s', letterSpacing: '1px' }}
                  >
                    {isSubmitting ? 'Procesando...' : 'Publicar'}
                  </button>
                </div>
              </form>
            )}
          </div>

          <div>
            <div style={{ display: 'flex', gap: '0.8rem', overflowX: 'auto', paddingBottom: '1rem', borderBottom: '1px solid #262932', marginBottom: '2rem', scrollbarWidth: 'none' }}>
              <button onClick={() => setFilter('ALL')} style={{ background: filter === 'ALL' ? '#f4e951' : '#171a21', color: filter === 'ALL' ? '#000' : '#9ca3af', border: filter === 'ALL' ? 'none' : '1px solid #374151', padding: '0.7rem 1.5rem', borderRadius: '30px', fontWeight: '800', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s' }}>Todas ({reviewsData?.reviews.length || 0})</button>
              <button onClick={() => setFilter('POSITIVE')} style={{ background: filter === 'POSITIVE' ? '#f4e951' : '#171a21', color: filter === 'POSITIVE' ? '#000' : '#9ca3af', border: filter === 'POSITIVE' ? 'none' : '1px solid #374151', padding: '0.7rem 1.5rem', borderRadius: '30px', fontWeight: '800', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s' }}>Positivas ({reviewsData?.reviews.filter(r => r.score >= 4).length || 0})</button>
              <button onClick={() => setFilter('NEUTRAL')} style={{ background: filter === 'NEUTRAL' ? '#f4e951' : '#171a21', color: filter === 'NEUTRAL' ? '#000' : '#9ca3af', border: filter === 'NEUTRAL' ? 'none' : '1px solid #374151', padding: '0.7rem 1.5rem', borderRadius: '30px', fontWeight: '800', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s' }}>Neutrales ({reviewsData?.reviews.filter(r => r.score === 3).length || 0})</button>
              <button onClick={() => setFilter('NEGATIVE')} style={{ background: filter === 'NEGATIVE' ? '#f4e951' : '#171a21', color: filter === 'NEGATIVE' ? '#000' : '#9ca3af', border: filter === 'NEGATIVE' ? 'none' : '1px solid #374151', padding: '0.7rem 1.5rem', borderRadius: '30px', fontWeight: '800', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s' }}>Negativas ({reviewsData?.reviews.filter(r => r.score <= 2).length || 0})</button>
            </div>

            {filteredReviews.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem 0', color: '#6b7280', fontSize: '1.1rem' }}>
                No hay reseñas escritas en esta categoría.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
                {filteredReviews.map(r => <ReviewCard key={r.id} review={r} />)}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};