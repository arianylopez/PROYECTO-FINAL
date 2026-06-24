import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FeaturedHero } from '../features/catalog/components/FeaturedHero';
import { MovieCatalog } from '../features/catalog/components/MovieCatalog';
import { fetchRecommendations, markNotInterested, type RecommendationResponse } from '../features/catalog/catalogApi';
import { useAuthStore } from '../shared/store/authStore';
import './HomePage.css';

export const HomePage = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [recs, setRecs] = useState<RecommendationResponse | null>(null);
  
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchRecommendations(user?.id)
      .then(setRecs)
      .catch(err => console.error("Error al cargar recomendaciones:", err));
  }, [user]);

  const getShortReason = (longReason: string) => {
    if (longReason.includes('género que calificaste')) return '⭐ Por tu actividad';
    if (longReason.includes('Quiero ver')) return '🎬 Por tu Watchlist';
    if (longReason.includes('géneros favoritos')) return '🎭 Porque te gusta';
    if (longReason.includes('tendencia')) return '🔥 Tendencia';
    return 'Recomendada';
  };

  const scrollCarousel = (scrollOffset: number) => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({
        left: scrollOffset,
        behavior: 'smooth'
      });
    }
  };

  const handleDismiss = async (e: React.MouseEvent, movieId: string) => {
    e.stopPropagation();
    if (!user) return;
    
    setDismissedIds(prev => new Set(prev).add(movieId));
    
    try {
      await markNotInterested(movieId, user.id);
      
      setTimeout(() => {
        setRecs(prev => prev ? { ...prev, items: prev.items.filter(i => i.id !== movieId) } : prev);
      }, 400);
      
    } catch (err) {
      console.error("Error al descartar película", err);
      setDismissedIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(movieId);
        return newSet;
      });
    }
  };

  return (
    <div className="home">
      <FeaturedHero />

      {recs && recs.items.length > 0 && (
        <section className="recs">
          
          <div className="recs__header">
            <div>
              <h2 className="recs__title">
                {recs.title}
              </h2>
              {recs.subtitle && (
                <p className="recs__subtitle">
                  {recs.subtitle}
                </p>
              )}
            </div>

            <div className="recs__controls">
              <button 
                onClick={() => scrollCarousel(-280)}
                className="recs__control-btn"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
              </button>
              
              <button 
                onClick={() => scrollCarousel(280)}
                className="recs__control-btn"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>
            </div>
          </div>

          <div 
            ref={carouselRef}
            className="recs__carousel"
          >
            {recs.items.map(item => {
              const isDismissed = dismissedIds.has(item.id);
              
              return (
                <div 
                  key={`rec-${item.id}`} 
                  onClick={() => navigate(`/movie/${item.id}`)} 
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate(`/movie/${item.id}`); }}
                  role="button"
                  tabIndex={0}
                  className="recs__card"
                  style={{ 
                    minWidth: isDismissed ? '0px' : '260px', 
                    width: isDismissed ? '0px' : '260px', 
                    opacity: isDismissed ? 0 : 1,
                    transform: isDismissed ? 'scale(0.8)' : 'scale(1)',
                    marginRight: isDismissed ? '-1.75rem' : '0',
                    overflow: isDismissed ? 'hidden' : 'visible'
                  }}
                >
                  
                  <div className="recs__card-image-box">
                    {user && (
                      <button 
                        onClick={(e) => handleDismiss(e, item.id)}
                        className="recs__card-dismiss-btn"
                      >
                        ✕
                      </button>
                    )}

                    <img 
                      src={item.poster_url} 
                      alt={item.title} 
                      className="recs__card-img"
                    />
                  </div>
                  
                  <div className="recs__card-panel">
                    <span className={`recs__card-reason-short ${recs.is_personalized ? 'recs__card-reason-short--personalized' : 'recs__card-reason-short--generic'}`}>
                      {getShortReason(item.reason)}
                    </span>
                    <p className="recs__card-reason-long">
                      {item.reason}
                    </p>
                  </div>

                </div>
              );
            })}
          </div>
        </section>
      )}

      <div className="home__catalog">
        <MovieCatalog />
      </div>
    </div>
  );
};