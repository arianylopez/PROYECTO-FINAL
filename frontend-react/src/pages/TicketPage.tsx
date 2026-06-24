import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../shared/store/authStore';

export const TicketPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [purchaseData, setPurchaseData] = useState<any>(null);

  useEffect(() => {
    const td = sessionStorage.getItem('ticketData');
    if (!td) { 
      navigate('/home'); 
      return; 
    }
    
    setPurchaseData(JSON.parse(td));
  }, [navigate]);

  if (!purchaseData) return <div style={{ minHeight: '100vh', backgroundColor: '#0f1115' }}></div>;

  const { data, res, seatIds, invoice } = purchaseData;

  const screenDate = new Date(data.screening.start_time);
  const seatsLabels = seatIds.map((sid: string) => {
    const s = data.seats.find((x: any) => x.id === sid);
    return s ? `${s.row}${s.col}` : '';
  }).filter(Boolean);

  const handleGoHome = () => {
    sessionStorage.removeItem('ticketData');
    navigate('/home');
  };

  return (
    <div style={{ position: 'relative', minHeight: '100vh', color: '#ffffff', fontFamily: '"Inter", system-ui, sans-serif', paddingBottom: '4rem' }}>
      
      <div style={{ position: 'fixed', inset: 0, zIndex: -1 }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${data.movie.poster_url})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(50px) brightness(0.15)' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(15, 17, 21, 0.85)' }} />
      </div>

      <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '2rem' }}>
        
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '2rem', marginBottom: '3rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#6b7280', fontWeight: 'bold' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#6b7280', marginBottom: '0.5rem' }}></div>
            Selección de Asientos
          </div>
          <div style={{ width: '80px', height: '2px', backgroundColor: '#374151' }}></div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#6b7280', fontWeight: 'bold' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#6b7280', marginBottom: '0.5rem' }}></div>
            Pago
          </div>
          <div style={{ width: '80px', height: '2px', backgroundColor: '#f4e951' }}></div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#f4e951', fontWeight: 'bold' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#f4e951', marginBottom: '0.5rem', boxShadow: '0 0 10px #f4e951' }}></div>
            Entradas
          </div>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '70px', height: '70px', borderRadius: '50%', backgroundColor: 'rgba(74, 222, 128, 0.1)', color: '#4ade80', fontSize: '2.5rem', marginBottom: '1.5rem', border: '1px solid rgba(74, 222, 128, 0.3)' }}>
            ✓
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '900', margin: '0 0 0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>¡Compra realizada con éxito!</h1>
          <p style={{ color: '#9ca3af', fontSize: '1.1rem', margin: 0 }}>Tus entradas han sido generadas y enviadas a tu correo.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '3rem', alignItems: 'start' }}>
          
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: '100%', maxWidth: '420px', backgroundColor: '#171a21', borderRadius: '20px', border: '1px solid #262932', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.8)' }}>
              
              <div style={{ position: 'relative', height: '160px' }}>
                <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${data.movie.poster_url})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'brightness(0.4)' }} />
                <div style={{ position: 'absolute', bottom: '1rem', left: '1.5rem', right: '1.5rem' }}>
                  <span style={{ backgroundColor: '#f4e951', color: '#000', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '900', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'inline-block' }}>Entrada Digital</span>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: '900', margin: 0, textTransform: 'uppercase', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>{data.movie.title}</h2>
                </div>
              </div>

              <div style={{ padding: '2rem 1.5rem', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '-15px', left: '-15px', width: '30px', height: '30px', backgroundColor: '#0f1115', borderRadius: '50%' }}></div>
                <div style={{ position: 'absolute', top: '-15px', right: '-15px', width: '30px', height: '30px', backgroundColor: '#0f1115', borderRadius: '50%' }}></div>
                <div style={{ position: 'absolute', top: '0', left: '0', right: '0', borderTop: '2px dashed #262932' }}></div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                  <div>
                    <span style={{ display: 'block', fontSize: '0.8rem', color: '#9ca3af', textTransform: 'uppercase', fontWeight: '600' }}>Fecha</span>
                    <strong style={{ fontSize: '1.1rem', color: '#fff' }}>{screenDate.toLocaleDateString('es-ES', { day:'2-digit', month:'short', year: 'numeric' })}</strong>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ display: 'block', fontSize: '0.8rem', color: '#9ca3af', textTransform: 'uppercase', fontWeight: '600' }}>Hora</span>
                    <strong style={{ fontSize: '1.1rem', color: '#fff' }}>{screenDate.toLocaleTimeString('es-ES', { hour:'2-digit', minute:'2-digit' })}</strong>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                  <div>
                    <span style={{ display: 'block', fontSize: '0.8rem', color: '#9ca3af', textTransform: 'uppercase', fontWeight: '600' }}>Sala</span>
                    <strong style={{ fontSize: '1.2rem', color: '#f4e951' }}>{data.screening.room_name}</strong>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ display: 'block', fontSize: '0.8rem', color: '#9ca3af', textTransform: 'uppercase', fontWeight: '600' }}>Asientos ({invoice.totalTickets})</span>
                    <strong style={{ fontSize: '1.2rem', color: '#f4e951' }}>{seatsLabels.join(', ')}</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: '#ffffff', padding: '1rem', borderRadius: '12px' }}>
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${res.order_id}`} 
                    alt="QR Access Code" 
                    style={{ width: '160px', height: '160px' }} 
                  />
                </div>
                <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                  <span style={{ display: 'block', fontSize: '0.8rem', color: '#9ca3af', textTransform: 'uppercase', fontWeight: '600' }}>Número de Orden</span>
                  <span style={{ fontSize: '1.2rem', letterSpacing: '2px', fontFamily: 'monospace', color: '#fff' }}>{res.order_id}</span>
                </div>

              </div>
            </div>
          </div>

          <div style={{ backgroundColor: 'rgba(23, 26, 33, 0.7)', border: '1px solid #262932', borderRadius: '16px', padding: '2.5rem', backdropFilter: 'blur(12px)' }}>
            
            <h3 style={{ fontSize: '1.4rem', fontWeight: '900', marginBottom: '2rem', color: '#ffffff', borderBottom: '1px solid #374151', paddingBottom: '1rem' }}>
              Resumen de la Transacción
            </h3>

            <div style={{ marginBottom: '2rem' }}>
              <h4 style={{ color: '#f4e951', fontSize: '0.9rem', textTransform: 'uppercase', marginBottom: '0.8rem', fontWeight: '800' }}>Información del Comprador</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', color: '#e5e7eb', fontSize: '0.95rem' }}>
                <div><span style={{ color: '#9ca3af', display: 'block', fontSize: '0.8rem' }}>Nombre</span> {user?.name || 'Usuario CinemaPlus'}</div>
                <div><span style={{ color: '#9ca3af', display: 'block', fontSize: '0.8rem' }}>Email</span> {user?.email || 'usuario@correo.com'}</div>
              </div>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <h4 style={{ color: '#f4e951', fontSize: '0.9rem', textTransform: 'uppercase', marginBottom: '0.8rem', fontWeight: '800' }}>Detalles de Función</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: '#e5e7eb', fontSize: '0.95rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <li><strong style={{ color: '#9ca3af' }}>Película:</strong> {data.movie.title}</li>
                <li><strong style={{ color: '#9ca3af' }}>Asientos:</strong> {seatsLabels.join(', ')}</li>
                <li><strong style={{ color: '#9ca3af' }}>Entradas:</strong> {invoice.tickets.map((t:any) => `${t.name} (x${t.qty})`).join(' • ')}</li>
              </ul>
            </div>

            <div style={{ marginBottom: '2.5rem', backgroundColor: '#0f1115', padding: '1.5rem', borderRadius: '12px', border: '1px solid #374151' }}>
              <h4 style={{ color: '#f4e951', fontSize: '0.9rem', textTransform: 'uppercase', marginBottom: '1rem', fontWeight: '800' }}>Detalle de Pago</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', color: '#9ca3af', fontSize: '0.95rem', borderBottom: '1px solid #262932', paddingBottom: '1rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Subtotal</span><span>Bs. {invoice.subtotal.toFixed(2)}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Comisión de servicio</span><span>Bs. {invoice.fee.toFixed(2)}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Impuestos de ley</span><span>Bs. {invoice.tax.toFixed(2)}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Método de Pago</span><span style={{ textTransform: 'capitalize', color: '#fff' }}>{res.method}</span></div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '1.3rem', fontWeight: '900', color: '#ffffff' }}>
                <span>TOTAL PAGADO</span>
                <span style={{ color: '#4ade80' }}>Bs. {invoice.total.toFixed(2)}</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <button onClick={handleGoHome} style={{ width: '100%', backgroundColor: '#262932', color: '#fff', padding: '1rem', borderRadius: '8px', border: '1px solid #374151', fontWeight: '700', textTransform: 'uppercase', fontSize: '0.9rem', cursor: 'pointer', marginTop: '0.5rem' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#374151'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#262932'}>
                Volver al Catálogo
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};