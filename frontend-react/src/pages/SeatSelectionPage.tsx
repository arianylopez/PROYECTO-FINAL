import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { fetchScreeningSeats, lockScreeningSeats, unlockScreeningSeats, type Seat, type ScreeningSeatsResponse } from '../features/catalog/catalogApi';
import { useAuthStore } from '../shared/store/authStore';
import './SeatSelection.css';

export const SeatSelectionPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore(); 

  const [data, setData] = useState<ScreeningSeatsResponse | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [lockTimer, setLockTimer] = useState<number | null>(null);

  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);

  const loadSeatsData = async () => {
    try {
      if (!id) return;
      const res = await fetchScreeningSeats(id, user?.id);
      setData(res);

      const myLockedSeats = res.seats.filter(s => s.status === 'locked_by_me');
      
      if (myLockedSeats.length > 0) {
        setSelectedSeats(myLockedSeats);
        if (res.active_lock_ttl) {
          setLockTimer(res.active_lock_ttl);
        }
      } else {
        setSelectedSeats([]);
        setLockTimer(null);
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Error al cargar el mapa de butacas.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadSeatsData(); }, [id, user]);

  const purchaseSummary = useMemo(() => {
    if (!data) return { items: [], totalTickets: 0, totalPrice: 0 };
    
    let totalTickets = 0;
    let totalPrice = 0;
    const items: Array<{name: string, qty: number, price: number, total: number}> = [];

    Array.from(searchParams.entries()).forEach(([ticketId, qtyStr]) => {
      const qty = parseInt(qtyStr);
      const tt = data.ticket_types.find(t => t.id === ticketId);
      if (tt && qty > 0) {
        items.push({ name: tt.name, qty, price: tt.price, total: tt.price * qty });
        totalTickets += qty;
        totalPrice += (tt.price * qty);
      }
    });

    if (totalTickets === 0 && selectedSeats.length > 0) {
      totalTickets = selectedSeats.length; 
    }

    return { items, totalTickets, totalPrice };
  }, [data, searchParams, selectedSeats]);

  useEffect(() => {
    if (lockTimer === null || lockTimer <= 0) return;
    const interval = setInterval(() => setLockTimer(t => (t ? t - 1 : 0)), 1000);
    return () => clearInterval(interval);
  }, [lockTimer]);

  const toggleSeat = (seat: Seat) => {
    if (lockTimer && lockTimer > 0) {
        alert("Ya tienes una reserva en curso. Utiliza el botón 'Cancelar Reserva' si deseas cambiar de asientos.");
        return;
    }

    if (seat.status !== 'available' || seat.type === 'corridor') return;

    const isSelected = selectedSeats.some(s => s.id === seat.id);
    if (isSelected) {
      setSelectedSeats(prev => prev.filter(s => s.id !== seat.id));
    } else {
      if (selectedSeats.length >= purchaseSummary.totalTickets) {
        alert(`Solo puedes seleccionar ${purchaseSummary.totalTickets} asientos.`);
        return;
      }
      setSelectedSeats(prev => [...prev, seat]);
    }
  };

  const handleLockSeats = async () => {
    try {
      if (!user) {
        alert("Debes iniciar sesión para poder reservar butacas.");
        return navigate('/login');
      }

      setErrorMsg('');
      if (!id) return;
      
      const res = await lockScreeningSeats(id, selectedSeats.map(s => s.id), user.id);
      
      sessionStorage.setItem('lockExpiration', (Date.now() + res.expires_in_seconds * 1000).toString());
      
      const seatQuery = selectedSeats.map(s => s.id).join(',');
      navigate(`/booking/${id}/payment?${searchParams.toString()}&seats=${seatQuery}`);

    } catch (err: any) {
      if (err.response?.status === 409) {
        alert(err.response.data.detail);
        loadSeatsData(); 
      } else {
        setErrorMsg(err.response?.data?.detail || 'Error en la reserva.');
      }
    }
  };

  const handleCancelReservation = async () => {
    if (!user || !id) return;
    const confirm = window.confirm("¿Estás seguro que quieres cancelar tu reserva y liberar estos asientos?");
    if (!confirm) return;
    
    try {
        await unlockScreeningSeats(id, user.id);
        sessionStorage.removeItem('lockExpiration');
        loadSeatsData(); 
    } catch (err) {
        alert("Error de conexión al liberar asientos.");
    }
  };

  const handleContinuePayment = () => {
      const seatQuery = selectedSeats.map(s => s.id).join(',');
      navigate(`/booking/${id}/payment?${searchParams.toString()}&seats=${seatQuery}`);
  };

  if (isLoading) return <div className="seat-page__loading">Cargando experiencia...</div>;
  if (!data) return <div className="seat-page__error">Error cargando datos.</div>;

  const rows = Array.from(new Set(data.seats.map(s => s.row))).sort();
  const screenDate = new Date(data.screening.start_time);
  
  const hasActiveReservation = lockTimer !== null && lockTimer > 0 && selectedSeats.length > 0;

  return (
    <div className="seat-page">
      
      <div className="seat-page__bg-container">
        <div className="seat-page__bg-image" style={{ backgroundImage: `url(${data.movie.poster_url})` }} />
        <div className="seat-page__bg-overlay" />
      </div>

      <div className="seat-page__content">
        
        {hasActiveReservation && (
           <div className="reservation-alert">
              <div>
                 <h3 className="reservation-alert__title">¡Tienes una reserva pendiente!</h3>
                 <p className="reservation-alert__desc">El sistema ha recuperado tus asientos. Completa el pago antes de que expire la reserva.</p>
              </div>
              <div className="reservation-alert__actions">
                 <strong className="reservation-alert__timer">
                    {Math.floor(lockTimer / 60)}:{(lockTimer % 60).toString().padStart(2, '0')}
                 </strong>
                 <button onClick={handleCancelReservation} className="reservation-alert__btn-cancel">
                   Cancelar Reserva
                 </button>
              </div>
           </div>
        )}

        <div className="booking-steps">
          <div className="step step--active">
            <div className="step__dot"></div>
            Selección de Asientos
          </div>
          <div className="booking-steps__line"></div>
          <div className="step step--inactive">
            <div className="step__dot"></div>
            Pago
          </div>
          <div className="booking-steps__line"></div>
          <div className="step step--inactive">
            <div className="step__dot"></div>
            Confirmación
          </div>
        </div>

        <div className="layout-grid">
          
          <div className="movie-poster-card">
            <img src={data.movie.poster_url} alt={data.movie.title} className="movie-poster-card__img" />
            
            <h1 className="movie-poster-card__title">{data.movie.title}</h1>
            
            <div className="movie-poster-card__meta">
              <span>{Math.floor(data.movie.duration_minutes/60)}h {data.movie.duration_minutes%60}m</span>
              <span>|</span>
              <span className="movie-poster-card__rating">{data.movie.rating_classification}</span>
            </div>

            <div className="movie-poster-card__session">
              <p className="movie-poster-card__room">{data.screening.room_name}</p>
              <h3 className="movie-poster-card__date">
                {screenDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
              </h3>
              <h2 className="movie-poster-card__time">
                {screenDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
              </h2>
            </div>
          </div>

          <div className="seat-map-section">
            
            <div className="seat-map-section__screen">
              PANTALLA
            </div>

            <div className="seat-grid">
              {rows.map(row => (
                <div key={row} className="seat-row">
                  <div className="seat-row__label seat-row__label--left">{row}</div>
                  
                  <div className="seat-row__seats">
                    {data.seats.filter(s => s.row === row).sort((a, b) => a.col - b.col).map(seat => {
                      if (seat.type === 'corridor') return <div key={seat.id} className="seat-item seat-item--corridor" />;

                      const isSelected = selectedSeats.some(s => s.id === seat.id);
                      
                      let stateClass = 'seat-item--available';
                      if (seat.status === 'locked' && !isSelected) {
                        stateClass = 'seat-item--locked';
                      } else if (seat.status === 'sold') {
                        stateClass = 'seat-item--sold';
                      } else if (isSelected || seat.status === 'locked_by_me') {
                        stateClass = 'seat-item--selected';
                      }

                      const dimStyle = (hasActiveReservation && !isSelected) ? { opacity: 0.4 } : {};

                      return (
                        <div
                          key={seat.id}
                          onClick={() => toggleSeat(seat)}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleSeat(seat); }}
                          role="button"
                          tabIndex={0}
                          title={`${row}-${seat.col}`}
                          className={`seat-item ${stateClass}`}
                          style={dimStyle}
                        >
                          {(seat.status !== 'available' && !isSelected) ? '' : seat.col}
                        </div>
                      );
                    })}
                  </div>
                  
                  <div className="seat-row__label seat-row__label--right">{row}</div>
                </div>
              ))}
            </div>

            <div className="seat-legend">
              <div className="seat-legend__item"><div className="seat-legend__box seat-legend__box--available"></div> Disponible</div>
              <div className="seat-legend__item"><div className="seat-legend__box seat-legend__box--locked"></div> En proceso (Otro)</div>
              <div className="seat-legend__item"><div className="seat-legend__box seat-legend__box--selected"></div> Tu Reserva</div>
              <div className="seat-legend__item"><div className="seat-legend__box seat-legend__box--sold"></div> Ocupado</div>
            </div>
          </div>

          <div className="booking-summary">
            
            {errorMsg && (
               <div className="booking-summary__error">
                 {errorMsg}
               </div>
            )}

            <h3 className="booking-summary__title">Boletos seleccionados</h3>
            
            <div className="booking-summary__items">
              {purchaseSummary.items.map((item, idx) => (
                <div key={idx} className="booking-summary__item">
                  <span className="booking-summary__item-name">{item.name} <span className="booking-summary__item-qty">x{item.qty}</span></span>
                  <span className="booking-summary__item-total">Bs. {item.total.toFixed(2)}</span>
                </div>
              ))}
            </div>

            <h3 className="booking-summary__title">Asientos seleccionados</h3>
            <div className="booking-summary__seats">
              {selectedSeats.length > 0 ? selectedSeats.map(s => (
                <span key={s.id} className="booking-summary__seat-badge">
                  {s.row}{s.col}{selectedSeats[selectedSeats.length - 1].id !== s.id ? ',' : ''}
                </span>
              )) : (
                <span className="booking-summary__no-seats">Aún no has seleccionado asientos.</span>
              )}
            </div>

            <div className="booking-summary__total-row">
              <span className="booking-summary__total-label">Total a pagar:</span>
              <span className="booking-summary__total-val">Bs. {purchaseSummary.totalPrice.toFixed(2)}</span>
            </div>

            <div className="booking-summary__actions">
              {hasActiveReservation ? (
                 <button 
                  onClick={handleContinuePayment}
                  className="btn-primary">
                  Retomar Pago
                </button>
              ) : (
                <button 
                  onClick={handleLockSeats}
                  disabled={selectedSeats.length !== purchaseSummary.totalTickets}
                  className="btn-primary"
                >
                  Continuar
                </button>
              )}
              
              <button 
                onClick={() => navigate(-1)}
                className="btn-secondary"
              >
                {hasActiveReservation ? 'Volver' : 'Cancelar'}
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};