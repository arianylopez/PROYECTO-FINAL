import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchMovieDetail, type MovieDetail, type Screening } from '../features/catalog/catalogApi';
import { useAuthStore } from '../shared/store/authStore';

export const MovieDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [movie, setMovie] = useState<MovieDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');

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

  const groupedScreenings = useMemo(() => {
    if (!movie) return {};
    return movie.screenings.reduce((acc, sc) => {
      const dateKey = new Date(sc.start_time).toLocaleDateString('es-ES', { 
        weekday: 'short', day: 'numeric', month: 'short' 
      }).toUpperCase();
      
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(sc);
      return acc;
    }, {} as Record<string, Screening[]>);
  }, [movie]);

  const availableDates = Object.keys(groupedScreenings);

  useEffect(() => {
    if (availableDates.length > 0 && !selectedDate) {
      setSelectedDate(availableDates[0]);
    }
  }, [availableDates, selectedDate]);

  const handleBuyTicket = (screeningId: string) => {
    if (!user) {
      navigate(`/login?redirect=/booking/${screeningId}`);
    } else {
      navigate(`/booking/${screeningId}`);
    }
  };

  if (isLoading) return <div style={{ height: '100vh', backgroundColor: '#0f1115', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#f4e951' }}>Cargando...</div>;
  
  if (error || !movie) return (
    <div style={{ height: '100vh', backgroundColor: '#0f1115', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'white' }}>
      <h1 style={{ fontSize: '4rem', margin: 0 }}>🎬</h1>
      <h2>Esta película no está disponible</h2>
      <p style={{ color: '#9ca3af', marginBottom: '2rem' }}>Ocurrió un error o la película ya no se encuentra en cartelera.</p>
      <button onClick={() => navigate('/home')} style={{ background: '#f4e951', color: '#000', padding: '0.8rem 2rem', borderRadius: '30px', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>
        Volver a la cartelera
      </button>
    </div>
  );

  const getYoutubeId = (url: string) => {
    const match = url?.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&]{11})/);
    return match ? match[1] : null;
  };
  const ytId = getYoutubeId(movie.trailer_url);

  const screeningsForSelectedDate = groupedScreenings[selectedDate] || [];
  const groupedByFormat = screeningsForSelectedDate.reduce((acc, sc) => {
    const key = `${sc.format} • ${sc.language}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(sc);
    return acc;
  }, {} as Record<string, Screening[]>);

  return (
    <div style={{ backgroundColor: '#0f1115', minHeight: '100vh', color: 'white', fontFamily: 'system-ui, sans-serif' }}>
      
      <header style={{ padding: '1rem 6%', borderBottom: '1px solid #262932', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#171a21', position: 'sticky', top: 0, zIndex: 50 }}>
        <h2 style={{ color: '#f4e951', margin: 0, cursor: 'pointer' }} onClick={() => navigate('/home')}>CINEMAPLUS</h2>
        <button onClick={() => navigate('/home')} style={{ background: 'transparent', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>✕ Cerrar Detalle</button>
      </header>

      <section style={{ position: 'relative', width: '100%', padding: '4rem 6%', display: 'flex', gap: '3rem', alignItems: 'center', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: `url(${movie.poster_url})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(40px) brightness(0.25)', zIndex: 0 }} />
        
        <img src={movie.poster_url} alt={movie.title} style={{ width: '280px', borderRadius: '12px', zIndex: 1, boxShadow: '0 10px 30px rgba(0,0,0,0.8)' }} />
        
        <div style={{ zIndex: 1, maxWidth: '700px' }}>
          <div style={{ display: 'flex', gap: '0.8rem', marginBottom: '1rem' }}>
            <span style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '0.3rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem', border: '1px solid rgba(255,255,255,0.2)' }}>{movie.rating_classification}</span>
            <span style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '0.3rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem', border: '1px solid rgba(255,255,255,0.2)' }}>{Math.floor(movie.duration_minutes/60)}h {movie.duration_minutes%60}m</span>
          </div>
          <h1 style={{ fontSize: '3.5rem', fontWeight: '900', margin: '0 0 1rem 0', lineHeight: 1.1 }}>{movie.title}</h1>
          <p style={{ fontSize: '1.05rem', color: '#d1d5db', lineHeight: 1.6, marginBottom: '1.5rem' }}>{movie.synopsis}</p>
          <div style={{ fontSize: '0.9rem', color: '#9ca3af' }}>
            <p><strong style={{ color: 'white' }}>Director:</strong> {movie.director}</p>
            <p><strong style={{ color: 'white' }}>Géneros:</strong> {movie.genres?.join(' • ')}</p>
          </div>
        </div>
      </section>

      <section style={{ padding: '3rem 6%', display: 'grid', gridTemplateColumns: '1fr 350px', gap: '4rem', maxWidth: '1400px', margin: '0 auto' }}>
        
        <div>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', borderBottom: '1px solid #262932', paddingBottom: '1rem' }}>Horarios Disponibles</h3>
          
          {availableDates.length === 0 ? (
            <p style={{ color: '#9ca3af' }}>No hay funciones programadas para los próximos días.</p>
          ) : (
            <>
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid #262932' }}>
                {availableDates.map(date => (
                  <button 
                    key={date}
                    onClick={() => setSelectedDate(date)}
                    style={{ 
                      background: 'none', border: 'none', padding: '0 1rem 1rem', cursor: 'pointer', fontWeight: 'bold',
                      color: selectedDate === date ? '#f4e951' : '#9ca3af',
                      borderBottom: selectedDate === date ? '3px solid #f4e951' : '3px solid transparent'
                    }}
                  >
                    {date}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {Object.entries(groupedByFormat).map(([formatKey, screenings]) => (
                  <div key={formatKey} style={{ backgroundColor: '#171a21', padding: '1.5rem', borderRadius: '12px', border: '1px solid #262932' }}>
                    <h4 style={{ margin: '0 0 1rem 0', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ backgroundColor: '#374151', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.85rem' }}>{formatKey.split('•')[0].trim()}</span>
                      <span style={{ color: '#9ca3af', fontSize: '0.9rem' }}>{formatKey.split('•')[1].trim()}</span>
                    </h4>
                    
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.8rem' }}>
                      {screenings.map(sc => (
                        <button 
                          key={sc.id} 
                          onClick={() => handleBuyTicket(sc.id)}
                          style={{
                            backgroundColor: 'transparent', border: '1px solid #4b5563', color: 'white', 
                            padding: '0.6rem 1.5rem', borderRadius: '30px', fontSize: '1.1rem', fontWeight: 'bold', 
                            cursor: 'pointer', transition: 'all 0.2s'
                          }}
                          onMouseOver={(e) => { e.currentTarget.style.borderColor = '#f4e951'; e.currentTarget.style.color = '#f4e951'; }}
                          onMouseOut={(e) => { e.currentTarget.style.borderColor = '#4b5563'; e.currentTarget.style.color = 'white'; }}
                        >
                          {new Date(sc.start_time).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Tráiler</h3>
          {ytId ? (
            <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid #262932' }}>
              <iframe width="100%" height="200" src={`https://www.youtube.com/embed/${ytId}`} title="Trailer" frameBorder="0" allowFullScreen></iframe>
            </div>
          ) : (
            <div style={{ height: '200px', backgroundColor: '#171a21', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>
              Tráiler no disponible
            </div>
          )}
        </div>

      </section>
    </div>
  );
};