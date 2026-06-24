import { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchMovieScreenings, fetchMovies, type MovieScreeningsResponse, type Screening, type Movie } from '../features/catalog/catalogApi';
import { useAuthStore } from '../shared/store/authStore';
import { TicketSelectionModal } from '../features/catalog/components/TicketSelectionModal';
import './ScreeningSelection.css';

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

  if (isLoading) return <div className="screening-page__loading">Cargando funciones y cartelera...</div>;
  if (!data) return <div className="screening-page__error">No se encontraron funciones asociadas.</div>;

  const { movie } = data;

  return (
    <div className="screening-page">
      
      <div className="movie-banner">
        <img src={movie.poster_url} alt={movie.title} className="movie-banner__poster" />
        <div>
          <h1 className="movie-banner__title">{movie.title}</h1>
          <div className="movie-banner__meta">
            <span className="movie-banner__rating">{movie.rating_classification}</span>
            <span>{Math.floor(movie.duration_minutes / 60)}h {movie.duration_minutes % 60}m</span>
          </div>
        </div>
      </div>

      <div className="date-slider">
        <button onClick={() => handleScrollSlider('L')} className="date-slider__nav">‹</button>
        
        <div className="date-slider__list">
          {availableDates.map(date => (
            <button 
              key={date} onClick={() => { setSelectedDate(date); setActiveScreening(null); }}
              className={`date-slider__btn ${selectedDate === date ? 'date-slider__btn--active' : ''}`}
            >
              {date}
            </button>
          ))}
        </div>
        
        <button onClick={() => handleScrollSlider('R')} className="date-slider__nav">›</button>
      </div>

      <div className="formats-filter">
        {formatsList.map(fmt => (
          <button 
            key={fmt} onClick={() => { setSelectedFormat(fmt); setActiveScreening(null); }}
            className={`formats-filter__btn ${selectedFormat === fmt ? 'formats-filter__btn--active' : ''}`}
          >
            {fmt}
          </button>
        ))}
      </div>

      <div className="rooms-list">
        {Object.keys(roomsFiltered).length === 0 ? (
          <div className="rooms-list__empty">
            <p className="rooms-list__empty-text">No hay funciones que coincidan con los filtros seleccionados para este día.</p>
          </div>
        ) : (
          Object.entries(roomsFiltered).map(([roomName, screenings]) => (
            <div key={roomName} className="room-card">
              <div className="room-card__header">
                <h3 className="room-card__title">
                  {roomName}
                  <span className="room-card__format-badge">{screenings[0].format}</span>
                </h3>
                <div className="room-card__features">
                  <span>✓ Asientos Numerados</span>
                  <span>✓ Accesibilidad ♿</span>
                  <span>✓ {screenings[0].language}</span>
                </div>
              </div>

              <div className="room-card__times">
                  {screenings.map(sc => (
                    <button 
                      key={sc.id} onClick={() => handleOpenTicketModal(sc)}
                      className="time-btn"
                    >
                      {new Date(sc.start_time).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                    </button>
                  ))}
              </div>
            </div>
          ))
        )}
      </div>

      <section className="upcoming-section">
        <div className="upcoming-section__header">
          <h2 className="upcoming-section__title">PRÓXIMAMENTE</h2>
          <span className="upcoming-section__link">Ver todas</span>
        </div>

        <div className="upcoming-slider">
          <div ref={sliderRef} className="upcoming-slider__track">
            {upcomingMovies.map(upMovie => (
              <div key={upMovie.id} onClick={() => { navigate(`/movie/${upMovie.id}`); window.scrollTo(0,0); }} className="upcoming-card">
                <img src={upMovie.poster_url} alt={upMovie.title} className="upcoming-card__poster" />
                <h4 className="upcoming-card__title">{upMovie.title}</h4>
                <p className="upcoming-card__genres">{upMovie.genres.slice(0, 2).join(', ')}</p>
                <p className="upcoming-card__release">Estreno: {new Date(upMovie.release_date).getFullYear()}</p>
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