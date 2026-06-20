import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchMovieDetail, type MovieDetail } from '../features/catalog/catalogApi';
import { useAuthStore } from '../shared/store/authStore';

export const MovieDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [movie, setMovie] = useState<MovieDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const getMovie = async () => {
      try {
        if (!id) return;
        const data = await fetchMovieDetail(id);
        setMovie(data);
      } catch (err) {
        setError(true);
      } finally {
        setIsLoading(false);
      }
    };
    getMovie();
  }, [id]);

  const handleBuyTicket = () => {
    if (!user) {
      navigate(`/login?redirect=/movie/${movie?.id}/screenings`);
    } else {
      navigate(`/movie/${movie?.id}/screenings`);
    }
  };

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0f1115', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#f4e951', fontFamily: 'sans-serif', fontWeight: 'bold' }}>
        Cargando experiencia...
      </div>
    );
  }
  
  if (error || !movie) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0f1115', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'white', fontFamily: 'sans-serif' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Esta película no está disponible</h2>
        <button onClick={() => navigate('/home')} style={{ background: '#f4e951', color: '#0f1115', padding: '0.8rem 2rem', borderRadius: '30px', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>
          VOLVER A LA CARTELERA
        </button>
      </div>
    );
  }

  const friendlyDuration = `${Math.floor(movie.duration_minutes / 60)}h ${movie.duration_minutes % 60}m`;
  const releaseDate = new Date(movie.release_date).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });

  const getYoutubeId = (url: string) => {
    const match = url?.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&]{11})/);
    return match ? match[1] : null;
  };
  const ytId = getYoutubeId(movie.trailer_url);

  return (
    <div style={{ backgroundColor: '#0f1115', minHeight: '100vh', color: '#ffffff', fontFamily: '"Inter", system-ui, sans-serif', paddingBottom: '4rem' }}>
      
      <header style={{ backgroundColor: 'rgba(23, 26, 33, 0.95)', backdropFilter: 'blur(12px)', padding: '1.2rem 6%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #262932', position: 'sticky', top: 0, zIndex: 50 }}>
        <h1 style={{ color: '#f4e951', margin: 0, fontSize: '1.5rem', fontWeight: '900', letterSpacing: '0.5px', cursor: 'pointer' }} onClick={() => navigate('/home')}>
          CINEMAPLUS
        </h1>
        <button onClick={() => navigate('/home')} style={{ background: 'transparent', border: 'none', color: '#9ca3af', fontWeight: '600', cursor: 'pointer', transition: 'color 0.2s', fontSize: '1rem' }}
          onMouseOver={(e) => { e.currentTarget.style.color = '#ffffff'; }}
          onMouseOut={(e) => { e.currentTarget.style.color = '#9ca3af'; }}
        >
          ✕ Cerrar
        </button>
      </header>

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 2rem' }}>
        
        <section style={{ position: 'relative', width: '100%', borderRadius: '16px', overflow: 'hidden', border: '1px solid #262932', marginTop: '2rem', padding: '3rem' }}>
          <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${movie.poster_url})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(40px) brightness(0.2)', zIndex: 0 }}></div>
          
          <div style={{ position: 'relative', zIndex: 1, width: '100%' }}>
            <h2 style={{ fontSize: '3.5rem', fontWeight: '900', color: '#ffffff', margin: '0 0 2rem 0', textTransform: 'uppercase', letterSpacing: '-1px', textAlign: 'left', textShadow: '0 4px 10px rgba(0,0,0,0.5)' }}>
              {movie.title}
            </h2>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3rem', width: '100%' }}>
              
              <div style={{ flex: '1 1 25%', minWidth: '260px', maxWidth: '320px' }}>
                <img 
                  src={movie.poster_url} 
                  alt={movie.title} 
                  style={{ width: '100%', height: 'auto', borderRadius: '12px', boxShadow: '0 15px 35px rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.1)' }} 
                />
              </div>

              <div style={{ flex: '2 1 65%', minWidth: '320px', backgroundColor: '#000', borderRadius: '12px', overflow: 'hidden', border: '1px solid #262932', aspectRatio: '16/9', position: 'relative', boxShadow: '0 15px 35px rgba(0,0,0,0.4)' }}>
                {ytId ? (
                  <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${ytId}?autoplay=0`} title="Trailer Player" frameBorder="0" allowFullScreen></iframe>
                ) : (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#171a21' }}>
                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'rgba(244, 233, 81, 0.9)', color: '#0f1115', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingLeft: '6px', fontSize: '2rem' }}>
                      ▶
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        </section>

        <section style={{ display: 'flex', flexWrap: 'wrap', gap: '3rem', marginTop: '3rem', width: '100%' }}>
          
          <div style={{ flex: '2 1 65%', minWidth: '320px', display: 'flex', flexDirection: 'column', gap: '3rem' }}>
            
            <div>
              <h3 style={{ margin: '0 0 1.5rem 0', color: '#ffffff', fontSize: '1.5rem', fontWeight: '800' }}>
                Resumen de la película
              </h3>
              <p style={{ color: '#9ca3af', lineHeight: '1.8', fontSize: '1.1rem', margin: '0 0 2.5rem 0', textAlign: 'justify' }}>
                {movie.synopsis}
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem' }}>
                <div>
                  <span style={{ color: '#6b7280', display: 'block', fontSize: '0.9rem', fontWeight: '700', marginBottom: '0.4rem' }}>Director</span>
                  <strong style={{ color: '#ffffff', fontSize: '1.1rem' }}>{movie.director}</strong>
                </div>
                <div>
                  <span style={{ color: '#6b7280', display: 'block', fontSize: '0.9rem', fontWeight: '700', marginBottom: '0.4rem' }}>Detalle técnico</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginTop: '0.2rem' }}>
                    <span style={{ backgroundColor: '#262932', color: '#ffffff', padding: '0.2rem 0.6rem', borderRadius: '4px', fontWeight: '700', fontSize: '0.9rem', border: '1px solid #374151' }}>{movie.rating_classification}</span>
                    <span style={{ color: '#cbd5e1', fontSize: '1rem' }}>{friendlyDuration}</span>
                  </div>
                </div>
                <div>
                  <span style={{ color: '#6b7280', display: 'block', fontSize: '0.9rem', fontWeight: '700', marginBottom: '0.4rem' }}>Fecha de lanzamiento</span>
                  <span style={{ color: '#ffffff', fontSize: '1.05rem', fontWeight: '500' }}>{releaseDate}</span>
                </div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid #262932', paddingTop: '2.5rem' }}>
              <h3 style={{ margin: '0 0 1.5rem 0', color: '#ffffff', fontSize: '1.5rem', fontWeight: '800' }}>
                Reseñas de la película
              </h3>
              
              <div style={{ backgroundColor: '#171a21', padding: '1.5rem', borderRadius: '12px', border: '1px solid #262932' }}>
                <div style={{ display: 'flex', gap: '0.3rem', color: '#f4e951', fontSize: '1.2rem', marginBottom: '0.8rem' }}>
                  ★ ★ ★ ★ ★
                </div>
                <p style={{ color: '#e5e7eb', fontSize: '1.05rem', lineHeight: '1.6', margin: '0 0 1rem 0', fontStyle: 'italic' }}>
                  "Una experiencia visual impresionante. Mantiene la esencia del personaje mientras ofrece una narrativa profunda y cautivadora."
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.9rem' }}>
                    U
                  </div>
                  <span style={{ color: '#9ca3af', fontSize: '0.9rem' }}>Usuario verificado • Hace 2 días</span>
                </div>
              </div>
            </div>

          </div>

          {/* Columna Derecha (30%) - Botonera de Acción Sin Emojis */}
          <div style={{ flex: '1 1 25%', minWidth: '260px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'sticky', top: '100px' }}>
              
              <button 
                onClick={handleBuyTicket}
                style={{ width: '100%', backgroundColor: '#f4e951', color: '#0f1115', padding: '1.2rem', borderRadius: '8px', border: 'none', fontWeight: '900', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '1px', cursor: 'pointer', transition: 'background-color 0.2s' }}
                onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#e2d73f'; }}
                onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#f4e951'; }}
              >
                Comprar entradas
              </button>

              <button 
                onClick={() => alert('Próximamente: Funcionalidad de Favoritos')}
                style={{ width: '100%', backgroundColor: 'transparent', color: '#ffffff', padding: '1.2rem', borderRadius: '8px', border: '1px solid #4b5563', fontWeight: '700', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.5px', cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseOver={(e) => { e.currentTarget.style.borderColor = '#ffffff'; e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; }}
                onMouseOut={(e) => { e.currentTarget.style.borderColor = '#4b5563'; e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                Añadir a favoritos
              </button>

            </div>
          </div>

        </section>

      </div>
    </div>
  );
};