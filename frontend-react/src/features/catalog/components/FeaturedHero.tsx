import { useEffect, useState } from 'react';
import { fetchMovies, type Movie } from '../catalogApi';

export const FeaturedHero = () => {
  const [featuredMovie, setFeaturedMovie] = useState<Movie | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getFeaturedMovie = async () => {
      try {
        const data = await fetchMovies(1, 1);
        if (data.items.length > 0) {
          setFeaturedMovie(data.items[0]);
        }
      } catch (error) {
        console.error("[Internal Log] Error fetching featured movie", error);
      } finally {
        setIsLoading(false);
      }
    };
    getFeaturedMovie();
  }, []);

  if (isLoading || !featuredMovie) {
    return <section style={{ height: '450px', backgroundColor: '#1c1f2a' }}></section>;
  }

  return (
    <section style={{ 
      width: '100%', 
      height: '450px', 
      background: `linear-gradient(to top, #16181f 0%, rgba(22,24,31,0.6) 50%, rgba(22,24,31,0.8) 100%), url(${featuredMovie.poster_url}) center/cover center`,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-end',
      padding: '0 5% 4rem'
    }}>
      <span style={{ backgroundColor: '#ff4d4d', color: 'white', padding: '0.25rem 0.75rem', borderRadius: '4px', width: 'fit-content', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
        ESTRENO RECIENTE
      </span>
      <h2 style={{ fontSize: '3.5rem', fontWeight: '800', margin: '0 0 0.5rem 0', textShadow: '2px 4px 10px rgba(0,0,0,0.9)' }}>
        {featuredMovie.title.toUpperCase()}
      </h2>
      <p style={{ maxWidth: '600px', color: '#cbd5e1', margin: '0 0 1.5rem 0', fontSize: '1rem', lineHeight: '1.5', textShadow: '1px 2px 4px rgba(0,0,0,0.8)' }}>
        {featuredMovie.synopsis.length > 150 
          ? `${featuredMovie.synopsis.substring(0, 150)}...` 
          : featuredMovie.synopsis}
      </p>
      <div style={{ display: 'flex', gap: '1rem' }}>
        <button style={{ background: '#f4e951', color: 'black', border: 'none', padding: '0.8rem 2.5rem', borderRadius: '8px', fontWeight: '800', cursor: 'pointer', boxShadow: '0 4px 12px rgba(244,233,81,0.3)' }}>
          Reservar Ahora
        </button>
        {featuredMovie.trailer_url && (
          <a 
            href={featuredMovie.trailer_url} 
            target="_blank" 
            rel="noreferrer" 
            style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.4)', padding: '0.8rem 2.5rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', backdropFilter: 'blur(4px)', textDecoration: 'none', display: 'flex', alignItems: 'center' }}
          >
            Ver Trailer
          </a>
        )}
      </div>
    </section>
  );
};