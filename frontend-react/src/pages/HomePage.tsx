import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FeaturedHero } from '../features/catalog/components/FeaturedHero';
import { MovieCatalog } from '../features/catalog/components/MovieCatalog';
import { fetchRecommendations, markNotInterested, type RecommendationResponse } from '../features/catalog/catalogApi';
import { useAuthStore } from '../shared/store/authStore';

export const HomePage = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [recs, setRecs] = useState<RecommendationResponse | null>(null);
  
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

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
    <div style={{ backgroundColor: '#0f1115', minHeight: '100vh', paddingBottom: '4rem' }}>
      <FeaturedHero />

      {recs && recs.items.length > 0 && (
        <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '3rem 4% 1rem', borderBottom: '1px solid #262932' }}>
          <h2 style={{ color: '#fff', fontSize: '1.8rem', fontWeight: '900', margin: '0 0 0.5rem 0', textTransform: 'uppercase' }}>
            {recs.title}
          </h2>
          {recs.subtitle && (
            <p style={{ color: '#9ca3af', margin: '0 0 1.5rem 0', fontSize: '1rem' }}>
              {recs.subtitle}
            </p>
          )}

          <div style={{ display: 'flex', gap: '1.5rem', overflowX: 'auto', paddingBottom: '1.5rem', scrollbarWidth: 'thin', scrollbarColor: '#374151 transparent' }}>
            {recs.items.map(item => {
              const isDismissed = dismissedIds.has(item.id);
              
              return (
                <div 
                  key={`rec-${item.id}`} 
                  onClick={() => navigate(`/movie/${item.id}`)} 
                  title={item.reason} 
                  style={{ 
                    minWidth: isDismissed ? '0px' : '220px', 
                    width: isDismissed ? '0px' : '220px', 
                    opacity: isDismissed ? 0 : 1,
                    transform: isDismissed ? 'scale(0.8)' : 'scale(1)',
                    marginRight: isDismissed ? '-1.5rem' : '0', // Colapsa el gap
                    overflow: 'hidden',
                    cursor: 'pointer', 
                    position: 'relative', 
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)' 
                  }}
                  onMouseOver={(e) => { if (!isDismissed) e.currentTarget.style.transform = 'scale(1.05)'}}
                  onMouseOut={(e) => { if (!isDismissed) e.currentTarget.style.transform = 'scale(1)'}}
                >
                  
                  {user && (
                    <button 
                      onClick={(e) => handleDismiss(e, item.id)}
                      style={{
                        position: 'absolute', top: '10px', right: '10px', zIndex: 10,
                        backgroundColor: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', 
                        borderRadius: '50%', width: '32px', height: '32px', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1rem', cursor: 'pointer', transition: 'all 0.2s',
                        backdropFilter: 'blur(4px)'
                      }}
                      onMouseOver={e => { e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.9)'; e.currentTarget.style.transform = 'scale(1.1)'; }}
                      onMouseOut={e => { e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.6)'; e.currentTarget.style.transform = 'scale(1)'; }}
                      title="No me interesa esta recomendación"
                    >
                      ✕
                    </button>
                  )}

                  <div style={{ width: '220px' }}>
                    <img 
                      src={item.poster_url} 
                      alt={item.title} 
                      style={{ width: '100%', height: '330px', objectFit: 'cover', borderRadius: '12px', border: '1px solid #262932', boxShadow: '0 10px 20px rgba(0,0,0,0.5)' }} 
                    />
                    
                    <div style={{ 
                      backgroundColor: recs.is_personalized ? 'rgba(244, 233, 81, 0.95)' : 'rgba(255, 255, 255, 0.9)', 
                      color: '#000', padding: '0.6rem 0.8rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '800', position: 'absolute', bottom: '-15px', left: '10px', right: '10px', textAlign: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.5)', lineHeight: '1.2' 
                    }}>
                      {getShortReason(item.reason)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <div style={{ paddingTop: '2rem' }}>
        <MovieCatalog />
      </div>
    </div>
  );
};