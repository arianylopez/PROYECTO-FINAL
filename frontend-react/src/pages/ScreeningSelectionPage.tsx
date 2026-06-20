import { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchMovieScreenings, fetchMovies, type MovieScreeningsResponse, type Screening, type Movie } from '../features/catalog/catalogApi';
import { useAuthStore } from '../shared/store/authStore';

export const ScreeningSelectionPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [data, setData] = useState<MovieScreeningsResponse | null>(null);
  const [upcomingMovies, setUpcomingMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedFormat, setSelectedFormat] = useState<string>('Todos');
  const [selectedScreening, setSelectedScreening] = useState<string | null>(null);

  useEffect(() => {
    const getData = async () => {
      try {
        if (!id) return;
        const [screeningsResult, upcomingResult] = await Promise.all([
          fetchMovieScreenings(id),
          fetchMovies(1, 10) 
        ]);
        setData(screeningsResult);
        setUpcomingMovies(upcomingResult.items.filter(m => m.id !== id)); 
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    getData();
  }, [id]);

  const groupedByDate = useMemo(() => {
    if (!data) return {};
    return data.screenings.reduce((acc, sc) => {
      const dateObj = new Date(sc.start_time);
      const isToday = new Date().toDateString() === dateObj.toDateString();
      const isTomorrow = new Date(new Date().getTime() + 24 * 60 * 60 * 1000).toDateString() === dateObj.toDateString();
      
      let dateKey = dateObj.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
      if (isToday) dateKey = `Hoy ${dateObj.getDate()}`;
      if (isTomorrow) dateKey = `Mañana ${dateObj.getDate()}`;
      
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(sc);
      return acc;
    }, {} as Record<string, Screening[]>);
  }, [data]);

  const availableDates = Object.keys(groupedByDate);
  useEffect(() => { if (availableDates.length > 0 && !selectedDate) setSelectedDate(availableDates[0]); }, [availableDates, selectedDate]);

  const availableFormats = useMemo(() => {
    if (!data) return ['Todos'];
    const formats = new Set(data.screenings.map(s => s.format));
    return ['Todos', ...Array.from(formats)];
  }, [data]);

  const roomsForSelectedDate = useMemo(() => {
    const screenings = groupedByDate[selectedDate] || [];
    const filtered = selectedFormat === 'Todos' ? screenings : screenings.filter(s => s.format === selectedFormat);
    
    return filtered.reduce((acc, sc) => {
      if (!acc[sc.room]) acc[sc.room] = [];
      acc[sc.room].push(sc);
      return acc;
    }, {} as Record<string, Screening[]>);
  }, [groupedByDate, selectedDate, selectedFormat]);

  const handleContinue = () => {
    if (!selectedScreening) return;
    if (!user) {
      navigate(`/login?redirect=/booking/${selectedScreening}/seats`);
    } else {
      navigate(`/booking/${selectedScreening}/seats`);
    }
  };

  const carouselRef = useRef<HTMLDivElement>(null);
  const scrollCarousel = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (isLoading) return <div style={{ height: '80vh', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#f4e951' }}>Cargando funciones...</div>;
  if (!data) return <div style={{ height: '80vh', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white' }}>Película no encontrada.</div>;

  const { movie } = data;

  return (
    <div style={{ color: '#ffffff', fontFamily: '"Inter", system-ui, sans-serif' }}>
      
      <div style={{ backgroundColor: '#171a21', borderBottom: '1px solid #262932', padding: '2rem 0' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 2rem', display: 'flex', gap: '2rem', alignItems: 'center' }}>
          <img src={movie.poster_url} alt={movie.title} style={{ width: '100px', borderRadius: '8px', boxShadow: '0 10px 20px rgba(0,0,0,0.5)' }} />
          <div>
            <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '2.2rem', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '-1px' }}>{movie.title}</h1>
            <div style={{ display: 'flex', gap: '1rem', color: '#9ca3af', fontWeight: '700', fontSize: '0.9rem' }}>
              <span style={{ border: '1px solid #4b5563', padding: '0.2rem 0.6rem', borderRadius: '4px', color: '#fff' }}>{movie.rating_classification}</span>
              <span>{Math.floor(movie.duration_minutes/60)}h {movie.duration_minutes%60}m</span>
              <button onClick={() => navigate(`/movie/${movie.id}`)} style={{ background: 'none', border: 'none', color: '#f4e951', cursor: 'pointer', fontWeight: 'bold', textDecoration: 'underline' }}>Ver detalles</button>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '3rem 2rem' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid #262932', paddingBottom: '1rem' }}>
          
          <button style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer' }}>‹</button>
          
          <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', padding: '0.5rem', scrollbarWidth: 'none' }}>
            {availableDates.map(date => (
              <button 
                key={date} onClick={() => { setSelectedDate(date); setSelectedScreening(null); }}
                style={{ 
                  background: selectedDate === date ? '#f4e951' : '#171a21', 
                  color: selectedDate === date ? '#000' : 'white',
                  border: selectedDate === date ? 'none' : '1px solid #374151', 
                  padding: '0.8rem 2rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', whiteSpace: 'nowrap', transition: 'all 0.2s'
                }}
              >
                {date.toUpperCase()}
              </button>
            ))}
          </div>

          <button style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer' }}>›</button>
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '3rem' }}>
          {availableFormats.map(fmt => (
            <button 
              key={fmt} onClick={() => { setSelectedFormat(fmt); setSelectedScreening(null); }}
              style={{
                background: selectedFormat === fmt ? 'rgba(255,255,255,0.1)' : 'transparent',
                border: selectedFormat === fmt ? '1px solid white' : '1px solid #374151',
                color: selectedFormat === fmt ? 'white' : '#9ca3af',
                padding: '0.5rem 1.5rem', borderRadius: '30px', fontWeight: 'bold', cursor: 'pointer'
              }}
            >
              {fmt}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {Object.keys(roomsForSelectedDate).length === 0 ? (
             <div style={{ padding: '3rem', textAlign: 'center', backgroundColor: '#171a21', borderRadius: '12px' }}>
               <h3 style={{ color: '#9ca3af' }}>No hay funciones que coincidan con los filtros seleccionados.</h3>
             </div>
          ) : (
            Object.entries(roomsForSelectedDate).map(([roomName, screenings]) => (
              <div key={roomName} style={{ backgroundColor: '#171a21', borderRadius: '16px', border: '1px solid #262932', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                
                <div>
                  <h3 style={{ fontSize: '1.4rem', margin: '0 0 0.8rem 0', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                    {roomName}
                    <span style={{ backgroundColor: '#262932', color: '#f4e951', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem', letterSpacing: '1px' }}>{screenings[0].format}</span>
                  </h3>
                  <div style={{ display: 'flex', gap: '1rem', color: '#9ca3af', fontSize: '0.85rem', fontWeight: '600' }}>
                    <span>✓ Asientos numerados</span>
                    <span>✓ Accesibilidad ♿</span>
                    <span>✓ {screenings[0].language}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '2rem' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                    {screenings.map(sc => {
                      const isSelected = selectedScreening === sc.id;
                      return (
                        <button 
                          key={sc.id} onClick={() => setSelectedScreening(sc.id)}
                          style={{
                            backgroundColor: isSelected ? '#f4e951' : 'transparent',
                            color: isSelected ? '#000' : '#fff',
                            border: isSelected ? '2px solid #f4e951' : '2px solid #4b5563',
                            padding: '0.8rem 2rem', borderRadius: '8px', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s'
                          }}
                        >
                          {new Date(sc.start_time).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                        </button>
                      );
                    })}
                  </div>

                  <button 
                    onClick={handleContinue}
                    disabled={!screenings.some(s => s.id === selectedScreening)}
                    style={{
                      backgroundColor: screenings.some(s => s.id === selectedScreening) ? '#cc0000' : '#374151',
                      color: screenings.some(s => s.id === selectedScreening) ? '#fff' : '#9ca3af',
                      border: 'none', padding: '1rem 3rem', borderRadius: '8px', fontSize: '1.1rem', fontWeight: '900', cursor: screenings.some(s => s.id === selectedScreening) ? 'pointer' : 'not-allowed', textTransform: 'uppercase', transition: 'all 0.3s'
                    }}
                  >
                    Continuar ➔
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <section style={{ marginTop: '5rem', borderTop: '1px solid #262932', paddingTop: '3rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: '900', margin: 0 }}>PRÓXIMAMENTE</h2>
            <a href="#" style={{ color: '#f4e951', textDecoration: 'none', fontWeight: 'bold', fontSize: '1.1rem' }}>Ver todas</a>
          </div>

          <div style={{ position: 'relative' }}>
            <button onClick={() => scrollCarousel('left')} style={{ position: 'absolute', left: '-20px', top: '40%', zIndex: 10, background: '#171a21', border: '1px solid #374151', color: 'white', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', fontSize: '1.2rem' }}>‹</button>
            <button onClick={() => scrollCarousel('right')} style={{ position: 'absolute', right: '-20px', top: '40%', zIndex: 10, background: '#171a21', border: '1px solid #374151', color: 'white', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', fontSize: '1.2rem' }}>›</button>

            <div ref={carouselRef} style={{ display: 'flex', gap: '1.5rem', overflowX: 'auto', scrollBehavior: 'smooth', scrollbarWidth: 'none', padding: '1rem 0' }}>
              {upcomingMovies.map(upMovie => (
                <div key={upMovie.id} onClick={() => navigate(`/movie/${upMovie.id}`)} style={{ flex: '0 0 auto', width: '220px', cursor: 'pointer', transition: 'transform 0.2s' }} onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.03)'} onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}>
                  <img src={upMovie.poster_url} alt={upMovie.title} style={{ width: '100%', height: '330px', objectFit: 'cover', borderRadius: '12px', boxShadow: '0 10px 20px rgba(0,0,0,0.5)', marginBottom: '1rem' }} />
                  <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{upMovie.title}</h4>
                  <p style={{ margin: '0 0 0.3rem 0', fontSize: '0.85rem', color: '#9ca3af' }}>{upMovie.genres.slice(0,2).join(', ')}</p>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#f4e951', fontWeight: 'bold' }}>Estreno: {new Date(upMovie.release_date).toLocaleDateString('es-ES', { month:'short', year:'numeric'})}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};