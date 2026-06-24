import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchMovies, type Movie } from '../catalogApi';
import './FeaturedHero.css';

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
    return <section className="hero__skeleton"></section>;
  }

  return (
    <section 
      className="hero"
      style={{ background: `linear-gradient(to top, #0f1115 5%, rgba(15, 17, 21, 0.4) 60%, #0f1115 95%), url(${featuredMovie.poster_url}) center/cover no-repeat` }}
    >
      <div className="hero__content">
        <span className="hero__badge">
          ESTRENO DESTACADO
        </span>
        
        <h2 className="hero__title">
          {featuredMovie.title.toUpperCase()}
        </h2>
        
        <p className="hero__synopsis">
          {featuredMovie.synopsis}
        </p>
        
        <div className="hero__actions">
          <button 
            onClick={() => navigate(`/movie/${featuredMovie.id}`)}
            className="hero__btn"
          >
            Ver Funciones Disponibles
          </button>
          
          {featuredMovie.trailer_url && (
            <a 
              href={featuredMovie.trailer_url} 
              target="_blank" 
              rel="noreferrer" 
              className="hero__btn--trailer"
            >
              Ver Tráiler
            </a>
          )}
        </div>
      </div>
    </section>
  );
};