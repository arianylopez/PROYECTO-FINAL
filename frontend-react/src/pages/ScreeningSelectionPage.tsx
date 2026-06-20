import { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchMovieScreenings, fetchMovies, type MovieScreeningsResponse, type Screening, type Movie } from '../features/catalog/catalogApi';
import { useAuthStore } from '../shared/store/authStore';
import { TicketSelectionModal } from '../features/catalog/components/TicketSelectionModal';

export const ScreeningSelectionPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [data, setData] = useState<MovieScreeningsResponse | null>(null);
  const [upcomingMovies, setUpcomingMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedFormat, setSelectedFormat] = useState<string>('Todos');
  const [activeScreening, setActiveScreening] = useState<Screening | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const loadSelectionData = async () => {
      try {
        if (!id) return;
        const [screeningsResult, upcomingResult] = await Promise.all([
          fetchMovieScreenings(id),
          fetchMovies(1, 12)
        ]);
        setData(screeningsResult);
        setUpcomingMovies(upcomingResult.items.filter(m => m.id !== id));
      } catch (err) {
        console.error("Error cargando el flujo transaccional:", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadSelectionData();
  }, [id]);

  const groupedByDate = useMemo(() => {
    if (!data) return {};
    return data.screenings.reduce((acc, sc) => {
      const dateObj = new Date(sc.start_time);
      const isToday = new Date().toDateString() === dateObj.toDateString();
      const isTomorrow = new Date(new Date().getTime() + 86400000).toDateString() === dateObj.toDateString();
      
      let dateKey = dateObj.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
      if (isToday) dateKey = `Hoy ${dateObj.getDate()} ${dateObj.toLocaleDateString('es-ES', { month: 'short' })}`.toUpperCase();
      else if (isTomorrow) dateKey = `Mañ. ${dateObj.getDate()} ${dateObj.toLocaleDateString('es-ES', { month: 'short' })}`.toUpperCase();
      else dateKey = dateKey.toUpperCase();
      
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(sc);
      return acc;
    }, {} as Record<string, Screening[]>);
  }, [data]);

  const availableDates = Object.keys(groupedByDate);

  useEffect(() => {
    if (availableDates.length > 0 && !selectedDate) {
      setSelectedDate(availableDates[0]);
    }
  }, [availableDates, selectedDate]);

  const formatsList = useMemo(() => {
    if (!data) return ['Todos'];
    const unique = new Set(data.screenings.map(s => s.format));
    return ['Todos', ...Array.from(unique)];
  }, [data]);

  const roomsFiltered = useMemo(() => {
    const dayScreenings = groupedByDate[selectedDate] || [];
    const filtered = selectedFormat === 'Todos' ? dayScreenings : dayScreenings.filter(s => s.format === selectedFormat);
    
    return filtered.reduce((acc, sc) => {
      if (!acc[sc.room]) acc[sc.room] = []; 
      
      acc[sc.room].push(sc);
      return acc;
    }, {} as Record<string, Screening[]>);
  }, [groupedByDate, selectedDate, selectedFormat]);

  const handleOpenTicketModal = (sc: Screening) => {
    setActiveScreening(sc);
    setIsModalOpen(true);
  };

  const handleModalSubmit = (ticketCounts: Record<string, number>) => {
    setIsModalOpen(false);
    
    const query = new URLSearchParams();
    Object.entries(ticketCounts).forEach(([key, val]) => {
      if (val > 0) query.append(key, val.toString()); 
    });

    const targetPath = `/booking/${activeScreening?.id}/seats?${query.toString()}`;
    
    if (!user) {
      navigate(`/login?redirect=${encodeURIComponent(targetPath)}`);
    } else {
      navigate(targetPath);
    }
  };

  const sliderRef = useRef<HTMLDivElement>(null);
  const handleScrollSlider = (dir: 'L' | 'R') => {
    if (sliderRef.current) {
      const offset = dir === 'L' ? -280 : 300;
      sliderRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  if (isLoading) return <div style={{ minHeight: '70vh', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#f4e951', fontWeight: 'bold' }}>Cargando funciones y cartelera...</div>;
  if (!data) return <div style={{ minHeight: '70vh', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#ffffff' }}>No se encontraron funciones asociadas.</div>;

  const { movie } = data;

  return (
    <div style={{ color: '#ffffff', minHeight: '100vh', maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
      
      <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', backgroundColor: '#171a21', padding: '2rem', borderRadius: '16px', border: '1px solid #262932', marginBottom: '2.5rem' }}>
        <img src={movie.poster_url} alt={movie.title} style={{ width: '90px', borderRadius: '8px', boxShadow: '0 8px 16px rgba(0,0,0,0.4)' }} />
        <div>
          <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '2rem', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '-1px' }}>{movie.title}</h1>
          <div style={{ display: 'flex', gap: '1rem', color: '#9ca3af', fontWeight: '700', fontSize: '0.85rem', alignItems: 'center' }}>
            <span style={{ border: '1px solid #4b5563', padding: '0.15rem 0.5rem', borderRadius: '4px', color: '#fff' }}>{movie.rating_classification}</span>
            <span>{Math.floor(movie.duration_minutes / 60)}h {movie.duration_minutes % 60}m</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid #262932', paddingBottom: '1.25rem', marginBottom: '2rem' }}>
        
        
        <button onClick={() => handleScrollSlider('L')} style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: '1.5rem', cursor: 'pointer' }}>‹</button>
        
        <div style={{ display: 'flex', gap: '0.6rem', overflowX: 'auto', scrollbarWidth: 'none' }}>
          {availableDates.map(date => (
            <button 
              key={date} onClick={() => { setSelectedDate(date); setActiveScreening(null); }}
              style={{
                backgroundColor: selectedDate === date ? '#f4e951' : '#171a21',
                color: selectedDate === date ? '#0f1115' : '#ffffff',
                border: selectedDate === date ? 'none' : '1px solid #374151',
                padding: '0.75rem 1.5rem', borderRadius: '6px', fontWeight: '800', fontSize: '0.85rem', cursor: 'pointer', whiteSpace: 'nowrap'
              }}
            >
              {date}
            </button>
          ))}
        </div>
        
        <button onClick={() => handleScrollSlider('R')} style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: '1.5rem', cursor: 'pointer' }}>›</button>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2.5rem' }}>
        {formatsList.map(fmt => (
          <button 
            key={fmt} onClick={() => { setSelectedFormat(fmt); setActiveScreening(null); }}
            style={{
              backgroundColor: selectedFormat === fmt ? 'rgba(244, 233, 81, 0.1)' : 'transparent',
              border: selectedFormat === fmt ? '1px solid #f4e951' : '1px solid #374151',
              color: selectedFormat === fmt ? '#f4e951' : '#9ca3af',
              padding: '0.4rem 1.25rem', borderRadius: '20px', fontSize: '0.9rem', fontWeight: '700', cursor: 'pointer'
            }}
          >
            {fmt}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
        {Object.keys(roomsFiltered).length === 0 ? (
          <div style={{ padding: '4rem 2rem', textAlign: 'center', backgroundColor: '#171a21', borderRadius: '12px', border: '1px solid #262932' }}>
            <p style={{ color: '#9ca3af', margin: 0, fontSize: '1.1rem' }}>No hay funciones que coincidan con los filtros seleccionados para este día.</p>
          </div>
        ) : (
          Object.entries(roomsFiltered).map(([roomName, screenings]) => (
            <div key={roomName} style={{ backgroundColor: '#171a21', padding: '2rem', borderRadius: '16px', border: '1px solid #262932', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: '800', margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                  {roomName}
                  <span style={{ backgroundColor: '#262932', color: '#f4e951', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>{screenings[0].format}</span>
                </h3>
                <div style={{ display: 'flex', gap: '1.25rem', color: '#9ca3af', fontSize: '0.85rem', fontWeight: '600' }}>
                  <span>✓ Asientos Numerados</span>
                  <span>✓ Accesibilidad ♿</span>
                  <span>✓ {screenings[0].language}</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '2rem', borderTop: '1px solid #262932', paddingTop: '1.5rem' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                  {screenings.map(sc => (
                    <button 
                      key={sc.id} onClick={() => handleOpenTicketModal(sc)}
                      style={{
                        backgroundColor: '#0f1115', border: '1px solid #4b5563', color: '#ffffff',
                        padding: '0.75rem 1.75rem', borderRadius: '8px', fontSize: '1.1rem', fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s'
                      }}
                      onMouseOver={(e) => { e.currentTarget.style.borderColor = '#f4e951'; e.currentTarget.style.color = '#f4e951'; }}
                      onMouseOut={(e) => { e.currentTarget.style.borderColor = '#4b5563'; e.currentTarget.style.color = '#ffffff'; }}
                    >
                      {new Date(sc.start_time).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <section style={{ marginTop: '6rem', borderTop: '1px solid #262932', paddingTop: '3rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '900', margin: 0, letterSpacing: '0.5px' }}>PRÓXIMAMENTE</h2>
          <span style={{ color: '#f4e951', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', textDecoration: 'underline' }}>Ver todas</span>
        </div>

        <div style={{ position: 'relative', width: '100%' }}>
          <div ref={sliderRef} style={{ display: 'flex', gap: '1.5rem', overflowX: 'auto', scrollBehavior: 'smooth', paddingBottom: '1rem' }}>
            {upcomingMovies.map(upMovie => (
              <div key={upMovie.id} onClick={() => { navigate(`/movie/${upMovie.id}`); window.scrollTo(0,0); }} style={{ flex: '0 0 auto', width: '210px', cursor: 'pointer' }}>
                <img src={upMovie.poster_url} alt={upMovie.title} style={{ width: '100%', height: '310px', objectFit: 'cover', borderRadius: '12px', boxShadow: '0 10px 20px rgba(0,0,0,0.6)', marginBottom: '0.8rem' }} />
                <h4 style={{ margin: '0 0 0.3rem 0', fontSize: '1.05rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{upMovie.title}</h4>
                <p style={{ margin: '0 0 0.2rem 0', fontSize: '0.8rem', color: '#9ca3af' }}>{upMovie.genres.slice(0, 2).join(', ')}</p>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#f4e951', fontWeight: 'bold' }}>Estreno: {new Date(upMovie.release_date).getFullYear()}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <TicketSelectionModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onContinue={handleModalSubmit}
        ticketTypes={data.ticket_types} 
        screeningTime={activeScreening ? new Date(activeScreening.start_time).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : ''}
        screeningRoom={activeScreening?.room || ''}
      />

    </div>
  );
};