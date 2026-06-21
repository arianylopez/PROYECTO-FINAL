import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchMyOrders, type OrderHistoryItem } from '../features/catalog/catalogApi';
import { useAuthStore } from '../shared/store/authStore';

export const OrdersHistoryPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [orders, setOrders] = useState<OrderHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login?redirect=/me/orders');
      return;
    }

    const loadOrders = async () => {
      try {
        const data = await fetchMyOrders(user.id);
        setOrders(data);
      } catch (error) {
        console.error("Error al cargar historial:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadOrders();
  }, [user, navigate]);

  if (isLoading) return <div style={{ minHeight: '100vh', backgroundColor: '#0f1115', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#f4e951' }}>Cargando historial...</div>;

  return (
    <div style={{ backgroundColor: '#0f1115', minHeight: '100vh', color: '#ffffff', fontFamily: '"Inter", system-ui, sans-serif', padding: '3rem 2rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        <h1 style={{ fontSize: '2.5rem', fontWeight: '900', textTransform: 'uppercase', borderBottom: '1px solid #262932', paddingBottom: '1.5rem', marginBottom: '3rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          🍿 Mis Compras
        </h1>

        {orders.length === 0 ? (
          <div style={{ textAlign: 'center', backgroundColor: '#171a21', padding: '5rem 2rem', borderRadius: '16px', border: '1px solid #262932', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
            <div style={{ fontSize: '5rem', marginBottom: '1.5rem', opacity: 0.5 }}>🎟️</div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '1rem', color: '#e5e7eb' }}>Todavía no compraste entradas.</h2>
            <p style={{ color: '#9ca3af', marginBottom: '2.5rem', fontSize: '1.1rem' }}>¡Descubre los últimos estrenos y vive la magia del cine!</p>
            <button onClick={() => navigate('/home')} style={{ backgroundColor: '#f4e951', color: '#0f1115', border: 'none', padding: '1.2rem 2.5rem', borderRadius: '30px', fontWeight: '900', fontSize: '1.1rem', textTransform: 'uppercase', cursor: 'pointer', transition: 'transform 0.2s' }} onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'} onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}>
              ¡Explorá la cartelera!
            </button>
          </div>
        ) : (
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
            {orders.map(order => {
              const orderDate = new Date(order.created_at);
              const screenDate = new Date(order.start_time);

              return (
                <div key={order.id} style={{ backgroundColor: '#171a21', borderRadius: '16px', border: '1px solid #262932', overflow: 'hidden', display: 'flex', flexWrap: 'wrap', boxShadow: '0 15px 30px rgba(0,0,0,0.5)' }}>
                  
                  <div style={{ width: '180px', flexShrink: 0, position: 'relative' }}>
                    <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${order.poster_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
                  </div>

                  <div style={{ flex: '1 1 400px', padding: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                      <h2 style={{ fontSize: '1.6rem', fontWeight: '900', margin: 0, textTransform: 'uppercase' }}>{order.movie_title}</h2>
                      <span style={{ backgroundColor: 'rgba(74, 222, 128, 0.1)', color: '#4ade80', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '900', border: '1px solid rgba(74, 222, 128, 0.3)', textTransform: 'uppercase' }}>
                        {order.status}
                      </span>
                    </div>

                    <p style={{ color: '#9ca3af', fontSize: '0.85rem', marginBottom: '1.5rem', fontFamily: 'monospace' }}>Orden: {order.id} • Comprado el {orderDate.toLocaleDateString('es-ES')}</p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                      <div>
                        <span style={{ display: 'block', fontSize: '0.8rem', color: '#6b7280', textTransform: 'uppercase', fontWeight: 'bold' }}>Fecha de Función</span>
                        <strong style={{ fontSize: '1.1rem', color: '#fff' }}>{screenDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}</strong>
                      </div>
                      <div>
                        <span style={{ display: 'block', fontSize: '0.8rem', color: '#6b7280', textTransform: 'uppercase', fontWeight: 'bold' }}>Hora / Sala</span>
                        <strong style={{ fontSize: '1.1rem', color: '#fff' }}>{screenDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} • {order.room_name}</strong>
                      </div>
                      <div>
                        <span style={{ display: 'block', fontSize: '0.8rem', color: '#6b7280', textTransform: 'uppercase', fontWeight: 'bold' }}>Asientos ({order.seat_labels.length})</span>
                        <strong style={{ fontSize: '1.1rem', color: '#f4e951' }}>{order.seat_labels.join(', ')}</strong>
                      </div>
                      <div>
                        <span style={{ display: 'block', fontSize: '0.8rem', color: '#6b7280', textTransform: 'uppercase', fontWeight: 'bold' }}>Total Pagado</span>
                        <strong style={{ fontSize: '1.1rem', color: '#4ade80' }}>Bs. {order.total_price.toFixed(2)}</strong>
                      </div>
                    </div>

                    <div style={{ borderTop: '1px solid #262932', paddingTop: '1.5rem' }}>
                      <h4 style={{ fontSize: '0.9rem', color: '#9ca3af', textTransform: 'uppercase', marginBottom: '1rem' }}>Tus Entradas Digitales (QRs)</h4>
                      <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                        {order.tickets.map(ticket => (
                          <div key={ticket.seat_id} style={{ backgroundColor: '#fff', padding: '0.5rem', borderRadius: '8px', flexShrink: 0 }}>
                            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${ticket.qr_code}`} alt="QR Ticket" style={{ width: '80px', height: '80px', display: 'block' }} />
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
};