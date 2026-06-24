import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../shared/store/authStore';
import './Ticket.css';

export const TicketPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const purchaseData = useMemo(() => {
    const td = sessionStorage.getItem('ticketData');
    return td ? JSON.parse(td) : null;
  }, []);

  useEffect(() => {
    if (!purchaseData) {
      navigate('/home');
    }
  }, [purchaseData, navigate]);

  if (!purchaseData) return <div className="ticket-page"></div>;

  const { data, res, seatIds, invoice } = purchaseData;

  const screenDate = new Date(data.screening.start_time);
  const seatsLabels = seatIds
    .map((sid: string) => {
      const s = data.seats.find((x: any) => x.id === sid);
      return s ? `${s.row}${s.col}` : '';
    })
    .filter(Boolean);

  const handleGoHome = () => {
    sessionStorage.removeItem('ticketData');
    navigate('/home');
  };

  return (
    <div className="ticket-page">
      <div className="ticket-page__bg-container">
        <div className="ticket-page__bg-image" style={{ backgroundImage: `url(${data.movie.poster_url})` }} />
        <div className="ticket-page__bg-overlay" />
      </div>

      <div className="ticket-page__content">
        <div className="booking-steps">
          <div className="step step--inactive">
            <div className="step__dot"></div>
            Selección de Asientos
          </div>
          <div className="booking-steps__line"></div>
          <div className="step step--inactive">
            <div className="step__dot"></div>
            Pago
          </div>
          <div className="booking-steps__line"></div>
          <div className="step step--active">
            <div className="step__dot"></div>
            Entradas
          </div>
        </div>

        <div className="success-header">
          <div className="success-header__icon">✓</div>
          <h1 className="success-header__title">¡Compra realizada con éxito!</h1>
          <p className="success-header__desc">Tus entradas han sido generadas y enviadas a tu correo.</p>
        </div>

        <div className="ticket-grid">
          <div className="ticket-visual-wrapper">
            <div className="ticket-visual">
              <div className="ticket-visual__hero">
                <div className="ticket-visual__hero-bg" style={{ backgroundImage: `url(${data.movie.poster_url})` }} />
                <div className="ticket-visual__hero-content">
                  <span className="ticket-visual__badge">Entrada Digital</span>
                  <h2 className="ticket-visual__movie-title">{data.movie.title}</h2>
                </div>
              </div>

              <div className="ticket-visual__body">
                <div className="ticket-visual__cutout-left"></div>
                <div className="ticket-visual__cutout-right"></div>
                <div className="ticket-visual__dash-line"></div>

                <div className="ticket-visual__grid">
                  <div>
                    <span className="ticket-visual__label">Fecha</span>
                    <strong className="ticket-visual__val">
                      {screenDate.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </strong>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className="ticket-visual__label">Hora</span>
                    <strong className="ticket-visual__val">
                      {screenDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                    </strong>
                  </div>
                </div>

                <div className="ticket-visual__grid">
                  <div>
                    <span className="ticket-visual__label">Sala</span>
                    <strong className="ticket-visual__val--highlight">{data.screening.room_name}</strong>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className="ticket-visual__label">Asientos ({invoice.totalTickets})</span>
                    <strong className="ticket-visual__val--highlight">{seatsLabels.join(', ')}</strong>
                  </div>
                </div>

                <div className="ticket-visual__qr-container">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${res.order_id}`}
                    alt="QR Access Code"
                    className="ticket-visual__qr"
                  />
                </div>
                <div className="ticket-visual__order-info">
                  <span className="ticket-visual__label">Número de Orden</span>
                  <span className="ticket-visual__order-id">{res.order_id}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="ticket-receipt">
            <h3 className="ticket-receipt__title">Resumen de la Transacción</h3>

            <div className="ticket-receipt__section">
              <h4 className="ticket-receipt__section-title">Información del Comprador</h4>
              <div className="ticket-receipt__grid">
                <div>
                  <span className="ticket-receipt__label">Nombre</span> {user?.name || 'Usuario CinemaPlus'}
                </div>
                <div>
                  <span className="ticket-receipt__label">Email</span> {user?.email || 'usuario@correo.com'}
                </div>
              </div>
            </div>

            <div className="ticket-receipt__section">
              <h4 className="ticket-receipt__section-title">Detalles de Función</h4>
              <ul className="ticket-receipt__list">
                <li>
                  <strong className="ticket-receipt__list-label">Película:</strong> {data.movie.title}
                </li>
                <li>
                  <strong className="ticket-receipt__list-label">Asientos:</strong> {seatsLabels.join(', ')}
                </li>
                <li>
                  <strong className="ticket-receipt__list-label">Entradas:</strong>{' '}
                  {invoice.tickets.map((t: any) => `${t.name} (x${t.qty})`).join(' • ')}
                </li>
              </ul>
            </div>

            <div className="ticket-receipt__breakdown">
              <h4 className="ticket-receipt__section-title">Detalle de Pago</h4>
              <div className="ticket-receipt__totals">
                <div className="ticket-receipt__row">
                  <span>Subtotal</span>
                  <span>Bs. {invoice.subtotal.toFixed(2)}</span>
                </div>
                <div className="ticket-receipt__row">
                  <span>Comisión de servicio</span>
                  <span>Bs. {invoice.fee.toFixed(2)}</span>
                </div>
                <div className="ticket-receipt__row">
                  <span>Impuestos de ley</span>
                  <span>Bs. {invoice.tax.toFixed(2)}</span>
                </div>
                <div className="ticket-receipt__row">
                  <span>Método de Pago</span>
                  <span className="ticket-receipt__val-method">{res.method}</span>
                </div>
              </div>
              <div className="ticket-receipt__final">
                <span>TOTAL PAGADO</span>
                <span className="ticket-receipt__final-val">Bs. {invoice.total.toFixed(2)}</span>
              </div>
            </div>

            <button onClick={handleGoHome} className="ticket-receipt__btn">
              Volver al Catálogo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
