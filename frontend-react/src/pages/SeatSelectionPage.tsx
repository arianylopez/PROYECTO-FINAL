import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { fetchScreeningSeats, lockScreeningSeats, type Seat, type ScreeningSeatsResponse } from '../features/catalog/catalogApi';

export const SeatSelectionPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [data, setData] = useState<ScreeningSeatsResponse | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);

  const loadSeatsData = async () => {
    try {
      if (!id) return;
      const res = await fetchScreeningSeats(id);
      setData(res);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Error al cargar el mapa de butacas.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadSeatsData(); }, [id]);

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

    return { items, totalTickets, totalPrice };
  }, [data, searchParams]);

  const toggleSeat = (seat: Seat) => {
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
      setErrorMsg('');
      if (!id) return;
      await lockScreeningSeats(id, selectedSeats.map(s => s.id));
      navigate(`/booking/${id}/payment?${searchParams.toString()}`);
    } catch (err: any) {
      if (err.response?.status === 409) {
        alert(err.response.data.detail);
        setSelectedSeats([]);
        loadSeatsData(); 
      } else {
        setErrorMsg(err.response?.data?.detail || 'Error en la reserva.');
      }
    }
  };

  if (isLoading) return <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f1115', color: '#f4e951', fontFamily: 'system-ui' }}>Cargando experiencia...</div>;
  if (!data) return <div style={{ height: '100vh', backgroundColor: '#0f1115' }}>Error cargando datos.</div>;

  const rows = Array.from(new Set(data.seats.map(s => s.row))).sort();
  const screenDate = new Date(data.screening.start_time);

  return (
    <div style={{ position: 'relative', minHeight: '100vh', color: '#ffffff', fontFamily: '"Inter", system-ui, sans-serif', overflow: 'hidden' }}>
      
      <div style={{ position: 'fixed', inset: 0, zIndex: -1 }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${data.movie.poster_url})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(45px) brightness(0.2)' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(15, 17, 21, 0.75)' }} />
      </div>

      <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '2rem' }}>
        
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '2rem', marginBottom: '3rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#f4e951', fontWeight: 'bold' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#f4e951', marginBottom: '0.5rem', boxShadow: '0 0 10px #f4e951' }}></div>
            Selección de Asientos
          </div>
          <div style={{ width: '80px', height: '2px', backgroundColor: '#374151' }}></div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#6b7280', fontWeight: 'bold' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#374151', marginBottom: '0.5rem' }}></div>
            Pago
          </div>
          <div style={{ width: '80px', height: '2px', backgroundColor: '#374151' }}></div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#6b7280', fontWeight: 'bold' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#374151', marginBottom: '0.5rem' }}></div>
            Confirmación
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2.5rem', alignItems: 'flex-start' }}>
          
          <div style={{ flex: '1 1 250px', maxWidth: '320px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <img src={data.movie.poster_url} alt={data.movie.title} style={{ width: '100%', borderRadius: '12px', boxShadow: '0 15px 30px rgba(0,0,0,0.5)', border: '1px solid #262932', marginBottom: '1rem' }} />
            
            <h1 style={{ fontSize: '2rem', fontWeight: '900', margin: 0, textTransform: 'uppercase', lineHeight: '1.1' }}>{data.movie.title}</h1>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', color: '#9ca3af', fontSize: '0.9rem', fontWeight: 'bold' }}>
              <span>{Math.floor(data.movie.duration_minutes/60)}h {data.movie.duration_minutes%60}m</span>
              <span>|</span>
              <span style={{ border: '1px solid #4b5563', padding: '0.1rem 0.4rem', borderRadius: '4px', color: '#fff' }}>{data.movie.rating_classification}</span>
            </div>

            <div style={{ marginTop: '1.5rem', padding: '1.5rem', backgroundColor: 'rgba(23, 26, 33, 0.6)', borderRadius: '12px', border: '1px solid #262932' }}>
              <p style={{ margin: '0 0 0.5rem', color: '#9ca3af', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>{data.screening.room_name}</p>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800' }}>
                {screenDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
              </h3>
              <h2 style={{ margin: '0.5rem 0 0', color: '#f4e951', fontSize: '1.8rem', fontWeight: '900' }}>
                {screenDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
              </h2>
            </div>
          </div>

          <div style={{ flex: '2 1 500px', display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: 'rgba(15, 17, 21, 0.8)', padding: '3rem 2rem', borderRadius: '16px', border: '1px solid #262932', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
            
            <div style={{ width: '80%', maxWidth: '400px', height: '40px', backgroundColor: 'rgba(255,255,255,0.05)', clipPath: 'polygon(10% 0, 90% 0, 100% 100%, 0% 100%)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#6b7280', letterSpacing: '8px', fontWeight: '900', fontSize: '0.85rem', marginBottom: '4rem', boxShadow: '0 10px 20px rgba(255,255,255,0.02)' }}>
              PANTALLA
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {rows.map(row => (
                <div key={row} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '25px', fontWeight: 'bold', color: '#6b7280', textAlign: 'right', fontSize: '0.9rem' }}>{row}</div>
                  
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {data.seats.filter(s => s.row === row).sort((a, b) => a.col - b.col).map(seat => {
                      if (seat.type === 'corridor') return <div key={seat.id} style={{ width: '32px', height: '32px' }} />;

                      const isSelected = selectedSeats.some(s => s.id === seat.id);
                      
                      let bgColor = '#e5e7eb'; 
                      let fontColor = '#000000';
                      let cursor = 'pointer';
                      let borderColor = 'transparent';

                      if (seat.status === 'locked') {
                        bgColor = '#14532d'; 
                        fontColor = '#ffffff';
                        cursor = 'not-allowed';
                      } else if (seat.status === 'sold') {
                        bgColor = '#374151'; 
                        fontColor = '#9ca3af';
                        cursor = 'not-allowed';
                      } else if (isSelected) {
                        bgColor = '#f4e951'; 
                        fontColor = '#000000';
                        borderColor = '#ca8a04';
                      }

                      return (
                        <div
                          key={seat.id}
                          onClick={() => toggleSeat(seat)}
                          title={`${row}-${seat.col}`}
                          style={{
                            width: '32px', height: '32px', backgroundColor: bgColor, border: borderColor !== 'transparent' ? `2px solid ${borderColor}` : 'none',
                            borderRadius: '6px 6px 3px 3px', cursor: cursor, display: 'flex', justifyContent: 'center', alignItems: 'center',
                            color: fontColor, fontWeight: '800', fontSize: '0.75rem', transition: 'all 0.15s', boxShadow: 'inset 0 -3px 0 rgba(0,0,0,0.15)'
                          }}
                        >
                          {(seat.status !== 'available' && !isSelected) ? '' : seat.col}
                        </div>
                      );
                    })}
                  </div>
                  
                  <div style={{ width: '25px', fontWeight: 'bold', color: '#6b7280', textAlign: 'left', fontSize: '0.9rem' }}>{row}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '2rem', marginTop: '4rem', color: '#9ca3af', fontSize: '0.85rem', fontWeight: '600' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><div style={{ width: '14px', height: '14px', backgroundColor: '#e5e7eb', borderRadius: '3px' }}></div> Disponible</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><div style={{ width: '14px', height: '14px', backgroundColor: '#14532d', borderRadius: '3px' }}></div> Reservado</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><div style={{ width: '14px', height: '14px', backgroundColor: '#f4e951', borderRadius: '3px' }}></div> Seleccionado</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><div style={{ width: '14px', height: '14px', backgroundColor: '#374151', borderRadius: '3px' }}></div> No disponible</div>
            </div>
          </div>

          <div style={{ flex: '1 1 300px', maxWidth: '380px', backgroundColor: 'rgba(23, 26, 33, 0.8)', border: '1px solid #262932', padding: '2.5rem 2rem', borderRadius: '16px', backdropFilter: 'blur(10px)' }}>
            
            {errorMsg && (
               <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                 {errorMsg}
               </div>
            )}

            <h3 style={{ fontSize: '1.2rem', color: '#9ca3af', marginBottom: '1.5rem', fontWeight: '700' }}>Boletos seleccionados</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid #374151', paddingBottom: '1.5rem' }}>
              {purchaseSummary.items.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '1.05rem', fontWeight: '600' }}>{item.name} <span style={{ color: '#9ca3af' }}>x{item.qty}</span></span>
                  <span style={{ fontWeight: 'bold' }}>Bs. {item.total.toFixed(2)}</span>
                </div>
              ))}
            </div>

            <h3 style={{ fontSize: '1.2rem', color: '#9ca3af', marginBottom: '1rem', fontWeight: '700' }}>Asientos seleccionados</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', minHeight: '60px', marginBottom: '2rem', borderBottom: '1px solid #374151', paddingBottom: '1.5rem' }}>
              {selectedSeats.length > 0 ? selectedSeats.map(s => (
                <span key={s.id} style={{ color: '#f4e951', fontWeight: '900', fontSize: '1.1rem' }}>
                  {s.row}{s.col}{selectedSeats[selectedSeats.length - 1].id !== s.id ? ',' : ''}
                </span>
              )) : (
                <span style={{ color: '#6b7280', fontSize: '0.95rem' }}>Aún no has seleccionado asientos.</span>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
              <span style={{ fontSize: '1.2rem', color: '#9ca3af', fontWeight: '700' }}>Total a pagar:</span>
              <span style={{ fontSize: '1.8rem', fontWeight: '900', color: '#ffffff' }}>Bs. {purchaseSummary.totalPrice.toFixed(2)}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <button 
                onClick={handleLockSeats}
                disabled={selectedSeats.length !== purchaseSummary.totalTickets}
                style={{
                  width: '100%', padding: '1.1rem', borderRadius: '8px', border: 'none', fontWeight: '900', fontSize: '1.05rem', textTransform: 'uppercase', letterSpacing: '1px',
                  backgroundColor: selectedSeats.length === purchaseSummary.totalTickets ? '#f4e951' : '#374151',
                  color: selectedSeats.length === purchaseSummary.totalTickets ? '#000000' : '#9ca3af',
                  cursor: selectedSeats.length === purchaseSummary.totalTickets ? 'pointer' : 'not-allowed',
                  transition: 'background-color 0.2s'
                }}
              >
                Continuar
              </button>
              <button 
                onClick={() => navigate(-1)}
                style={{ width: '100%', padding: '1.1rem', borderRadius: '8px', backgroundColor: 'transparent', border: '1px solid #4b5563', color: '#ffffff', fontWeight: '700', fontSize: '1rem', textTransform: 'uppercase', cursor: 'pointer' }}
              >
                Cancelar
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};