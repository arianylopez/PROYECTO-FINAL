import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  fetchMyOrders, 
  fetchWatchlist, 
  toggleWatchlist, 
  fetchActivityHistory, 
  type OrderHistoryItem, 
  type WatchlistItem, 
  type ActivityItem 
} from '../features/catalog/catalogApi';
import { useAuthStore } from '../shared/store/authStore';
import './OrdersHistory.css';

export const OrdersHistoryPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  
  const queryParams = new URLSearchParams(location.search);
  const initialTab = (queryParams.get('tab') as 'tickets' | 'list' | 'activity') || 'tickets';

  const [activeTab, setActiveTab] = useState<'tickets' | 'list' | 'activity'>(initialTab);
  
  const [orders, setOrders] = useState<OrderHistoryItem[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<OrderHistoryItem | null>(null);

  useEffect(() => {
    navigate(`?tab=${activeTab}`, { replace: true });
  }, [activeTab, navigate]);

  useEffect(() => {
    if (!user) {
      navigate('/login?redirect=/me/orders');
      return;
    }

    const loadData = async () => {
      setIsLoading(true);
      try {
        if (activeTab === 'tickets' && orders.length === 0) {
          const data = await fetchMyOrders(user.id);
          setOrders(data);
        } else if (activeTab === 'list' && watchlist.length === 0) {
          const data = await fetchWatchlist(user.id);
          setWatchlist(data);
        } else if (activeTab === 'activity' && activities.length === 0) {
          const data = await fetchActivityHistory(user.id);
          setActivities(data);
        }
      } catch (error) {
        console.error(`Error cargando pestaña ${activeTab}:`, error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user, activeTab, navigate, orders.length, watchlist.length, activities.length]);

  const { upcomingOrders, pastOrders } = useMemo(() => {
    const now = new Date();
    const upcoming: OrderHistoryItem[] = [];
    const past: OrderHistoryItem[] = [];
    orders.forEach(order => {
      const screenTime = new Date(order.start_time);
      if (screenTime > now) upcoming.push(order);
      else past.push(order);
    });
    return { upcomingOrders: upcoming, pastOrders: past };
  }, [orders]);

  const handleRemoveFromWatchlist = async (movieId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    try {
      await toggleWatchlist(movieId, user.id, "", "");
      setWatchlist(prev => prev.filter(i => i.movie_id !== movieId));
    } catch (err) {
      alert("Error al remover de la lista.");
    }
  };

  const getIconColor = (type: string) => {
    switch(type) {
      case 'rating': return '#f4e951';
      case 'review': return '#60a5fa';
      case 'purchase': return '#4ade80';
      case 'watchlist': return '#f87171';
      default: return '#9ca3af';
    }
  };

  if (!user) return null;

  return (
    <div className="profile">
      <div className="profile__container">
        
        <div className="profile__sidebar">
          <div className="profile__user">
            <div className="profile__avatar">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <h3 className="profile__username">{user?.name}</h3>
              <span className="profile__badge">Cinéfilo Activo</span>
            </div>
          </div>

          <nav className="profile__nav">
            <button 
              onClick={() => { setActiveTab('tickets'); setSelectedOrder(null); }} 
              className={`profile__nav-btn ${activeTab === 'tickets' ? 'profile__nav-btn--active' : ''}`}
            >
              🎟️ Mis Entradas
            </button>
            <button 
              onClick={() => { setActiveTab('list'); setSelectedOrder(null); }} 
              className={`profile__nav-btn ${activeTab === 'list' ? 'profile__nav-btn--active' : ''}`}
            >
              ⭐ Mi Lista
            </button>
            <button 
              onClick={() => { setActiveTab('activity'); setSelectedOrder(null); }} 
              className={`profile__nav-btn ${activeTab === 'activity' ? 'profile__nav-btn--active' : ''}`}
            >
              📊 Mi Actividad
            </button>
          </nav>
        </div>

        <div className="profile__content">
          
          {isLoading ? (
             <div className="profile__loading">Cargando información...</div>
          ) : (
            <>
              {activeTab === 'tickets' && (
                orders.length === 0 ? (
                  <div className="profile__empty">
                    <div className="profile__empty-icon">🎬</div>
                    <h2 className="profile__empty-title">No tienes entradas aún</h2>
                    <button onClick={() => navigate('/home')} className="profile__empty-btn">Explorar Cartelera</button>
                  </div>
                ) : (
                  <div className="tickets__layout">
                    <div className="tickets__list-container" style={{ flex: selectedOrder ? '1' : '100%' }}>
                      <h2 className="profile__title">Mis Entradas</h2>
                      
                      {upcomingOrders.length > 0 && (
                        <div style={{ marginBottom: '3rem' }}>
                          <h3 className="tickets__section-title">Próximas Funciones</h3>
                          <div className="tickets__list">
                            {upcomingOrders.map(order => (
                              <div key={order.id} onClick={() => setSelectedOrder(order)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelectedOrder(order); }} role="button" tabIndex={0} className={`ticket-card ${selectedOrder?.id === order.id ? 'ticket-card--active' : ''}`}>
                                <img src={order.poster_url} className="ticket-card__poster" alt="Poster" />
                                <div className="ticket-card__info">
                                  <div className="ticket-card__header">
                                    <h4 className="ticket-card__title">{order.movie_title}</h4>
                                    <span className="ticket-card__status">PRÓXIMO</span>
                                  </div>
                                  <p className="ticket-card__text">{new Date(order.start_time).toLocaleString('es-ES', { weekday:'short', day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}</p>
                                  <p className="ticket-card__text ticket-card__text--muted">{order.room_name} • Asientos: {order.seat_labels.join(', ')}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {pastOrders.length > 0 && (
                        <div>
                          <h3 className="tickets__section-title">Historial</h3>
                          <div className="tickets__list">
                            {pastOrders.map(order => (
                              <div key={order.id} onClick={() => setSelectedOrder(order)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelectedOrder(order); }} role="button" tabIndex={0} className={`ticket-card ticket-card--past ${selectedOrder?.id === order.id ? 'ticket-card--active' : ''}`}>
                                <img src={order.poster_url} className="ticket-card__poster ticket-card__poster--past" alt="Poster" />
                                <div className="ticket-card__info">
                                  <div className="ticket-card__header">
                                    <h4 className="ticket-card__title">{order.movie_title}</h4>
                                    <span className="ticket-card__status ticket-card__status--past">FINALIZADA</span>
                                  </div>
                                  <p className="ticket-card__text ticket-card__text--muted">{new Date(order.start_time).toLocaleDateString('es-ES', { day:'numeric', month:'long', year:'numeric' })}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {selectedOrder && (
                      <div className="ticket-detail">
                        <div className="ticket-detail__hero">
                          <div className="ticket-detail__hero-bg" style={{ backgroundImage: `url(${selectedOrder.poster_url})` }}></div>
                          <button onClick={() => setSelectedOrder(null)} className="ticket-detail__close">✕</button>
                          <div className="ticket-detail__hero-content">
                            <h2 className="ticket-detail__title">{selectedOrder.movie_title}</h2>
                          </div>
                        </div>
                        <div className="ticket-detail__body">
                          <div className="ticket-detail__qr">
                            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${selectedOrder.id}`} alt="QR" className="ticket-detail__qr-img" />
                          </div>
                          <div className="ticket-detail__section">
                            <h4 className="ticket-detail__section-title">Información de la Función</h4>
                            <div className="ticket-detail__grid">
                                <div><span className="ticket-detail__label">Fecha</span> {new Date(selectedOrder.start_time).toLocaleDateString('es-ES')}</div>
                                <div><span className="ticket-detail__label">Hora</span> {new Date(selectedOrder.start_time).toLocaleTimeString('es-ES', {hour:'2-digit', minute:'2-digit'})}</div>
                                <div><span className="ticket-detail__label">Sala</span> {selectedOrder.room_name}</div>
                                <div><span className="ticket-detail__label">Asientos ({selectedOrder.seat_labels.length})</span> <strong className="ticket-detail__highlight">{selectedOrder.seat_labels.join(', ')}</strong></div>
                            </div>
                          </div>
                          <div className="ticket-detail__summary">
                            <h4 className="ticket-detail__section-title ticket-detail__section-title--muted">Resumen de Pago</h4>
                            <div className="ticket-detail__row"><span>Estado</span> <span className="ticket-detail__status-text">{selectedOrder.status}</span></div>
                            <div className="ticket-detail__row"><span>Orden</span> <span className="ticket-detail__id-text">{selectedOrder.id}</span></div>
                            <div className="ticket-detail__total-row">
                                <span>TOTAL</span>
                                <span>Bs. {selectedOrder.total_price.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              )}

              {activeTab === 'list' && (
                <div>
                  <h2 className="profile__title">Mi Lista</h2>
                  {watchlist.length === 0 ? (
                    <p className="profile__empty-text">No has guardado ninguna película.</p>
                  ) : (
                    <div className="watchlist-grid">
                      {watchlist.map(item => (
                        <div key={item.id} onClick={() => navigate(`/movie/${item.movie_id}`)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate(`/movie/${item.movie_id}`); }} role="button" tabIndex={0} className="watchlist-card">
                          <img src={item.poster_url} alt={item.movie_title} className="watchlist-card__poster" />
                          <div className="watchlist-card__body"><h3 className="watchlist-card__title">{item.movie_title}</h3></div>
                          <button onClick={(e) => handleRemoveFromWatchlist(item.movie_id, e)} className="watchlist-card__remove">✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'activity' && (
                <div className="activity__container">
                  <h2 className="profile__title">Mi Actividad</h2>
                  {activities.length === 0 ? (
                    <p className="profile__empty-text">Aún no hay actividad registrada en tu cuenta.</p>
                  ) : (
                    <div className="activity__timeline">
                      <div className="activity__timeline-line"></div>
                      {activities.map((act) => (
                        <div key={act.id} className="activity-item">
                          <div className="activity-item__dot" style={{ backgroundColor: getIconColor(act.type) }}></div>
                          <div className="activity-item__card">
                            <div className="activity-item__header">
                              <strong className="activity-item__title" style={{ color: getIconColor(act.type) }}>{act.title}</strong>
                              <span className="activity-item__date">{new Date(act.date).toLocaleString('es-ES')}</span>
                            </div>
                            <p className="activity-item__desc">{act.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
};