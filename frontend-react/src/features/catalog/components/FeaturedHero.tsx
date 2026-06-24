import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchMovies, type Movie } from '../catalogApi';

export const FeaturedHero = () => {
  const [featuredMovie, setFeaturedMovie] = useState<Movie | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const getFeatured = async () => {
      try {
        const data = await fetchMovies(1, 1);
        if (data.items && data.items.length > 0) {
          setFeaturedMovie(data.items[0]);
        }
      } catch (err) {
        console.error("[Internal Log] Failure reading featured banner asset:", err);
      } finally {
        setIsLoading(false);
      }
    };
    getFeatured();
  }, []);

  if (isLoading || !featuredMovie) {
    return <section style={{ height: '500px', backgroundColor: '#0f1115' }}></section>;
  }

  return (
    <section style={{ 
      width: '100%', 
      height: '550px', 
      background: `linear-gradient(to top, #0f1115 5%, rgba(15, 17, 21, 0.4) 60%, #0f1115 95%), url(${featuredMovie.poster_url}) center/cover no-repeat`,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-end',
      padding: '0 6% 5rem'
    }}>
      <div style={{ maxWidth: '650px' }}>
        <span style={{ 
          backgroundColor: '#ff3333', 
          color: 'white', 
          padding: '0.3rem 0.8rem', 
          borderRadius: '4px', 
          fontSize: '0.75rem', 
          fontWeight: '800', 
          letterSpacing: '1px',
          display: 'inline-block',
          marginBottom: '1rem'
        }}>
          ESTRENO DESTACADO
        </span>
        
        <h2 style={{ 
          fontSize: '4rem', 
          fontWeight: '900', 
          margin: '0 0 0.75rem 0', 
          letterSpacing: '-1.5px',
          lineHeight: '1.1',
          textShadow: '3px 6px 15px rgba(0,0,0,0.9)' 
        }}>
          {featuredMovie.title.toUpperCase()}
        </h2>
        
        <p style={{ 
          color: '#e5e7eb', 
          margin: '0 0 2rem 0', 
          fontSize: '1.05rem', 
          lineHeight: '1.6', 
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          textShadow: '1px 2px 4px rgba(0,0,0,0.8)' 
        }}>
          {featuredMovie.synopsis}
        </p>
        
        <div style={{ display: 'flex', gap: '1.25rem' }}>
          <button 
            onClick={() => navigate(`/movie/${featuredMovie.id}`)}
            style={{ 
            background: '#f4e951', 
            color: '#0f1115', 
            border: 'none', 
            padding: '0.9rem 3rem', 
            borderRadius: '30px', 
            fontWeight: '800', 
            fontSize: '0.95rem',
            cursor: 'pointer', 
            boxShadow: '0 5px 25px rgba(244,233,81,0.35)',
            transition: 'all 0.2s'
          }}>
            Ver Funciones Disponibles
          </button>
          
          {featuredMovie.trailer_url && (
            <a 
              href={featuredMovie.trailer_url} 
              target="_blank" 
              rel="noreferrer" 
              style={{ 
                background: 'rgba(255,255,255,0.1)', 
                color: 'white', 
                border: '1px solid rgba(255,255,255,0.3)', 
                padding: '0.9rem 3rem', 
                borderRadius: '30px', 
                fontWeight: '700', 
                fontSize: '0.95rem',
                cursor: 'pointer', 
                backdropFilter: 'blur(8px)', 
                textDecoration: 'none', 
                display: 'inline-flex', 
                alignItems: 'center',
                transition: 'all 0.2s'
              }}
            >
              Ver Tráiler
            </a>
          )}
        </div>
      </div>
    </section>
  );
};