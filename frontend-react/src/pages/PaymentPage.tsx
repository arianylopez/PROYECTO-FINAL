import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { fetchScreeningSeats, processScreeningPurchase, type ScreeningSeatsResponse } from '../features/catalog/catalogApi';
import { useAuthStore } from '../shared/store/authStore';

import { validateLuhn, detectCardBrand, isCardExpired } from '../shared/utils/cardUtils';
import './Payment.css';

export const PaymentPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const { user } = useAuthStore();

  const [data, setData] = useState<ScreeningSeatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const [paymentMethod, setPaymentMethod] = useState<'card' | 'qr'>('card');
  const [cardNumber, setCardNumber] = useState('');
  const [cardMonth, setCardMonth] = useState('');
  const [cardYear, setCardYear] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');

  const [cardBrand, setCardBrand] = useState('Unknown');
  const [luhnError, setLuhnError] = useState(false);

  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const seatIds = searchParams.get('seats')?.split(',') || [];

  useEffect(() => {
    const init = async () => {
      try {
        if (!id) return;
        const res = await fetchScreeningSeats(id);
        setData(res);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [id]);

  useEffect(() => {
    const checkExpiration = () => {
      const exp = sessionStorage.getItem('lockExpiration');
      if (exp && Date.now() > parseInt(exp)) {
        alert('Tu reserva expiró. Volvé a elegir tus butacas.');
        navigate(`/booking/${id}/seats`);
      }
    };
    checkExpiration();
    const interval = setInterval(checkExpiration, 5000);
    return () => clearInterval(interval);
  }, [id, navigate]);

  const invoice = useMemo(() => {
    if (!data) return { subtotal: 0, fee: 0, tax: 0, total: 0, tickets: [] };
    let subtotal = 0;
    const tickets: any[] = [];
    
    Array.from(searchParams.entries()).forEach(([key, val]) => {
      if (key !== 'seats') {
        const qty = parseInt(val);
        const tt = data.ticket_types.find(t => t.id === key);
        if (tt && qty > 0) {
          subtotal += (tt.price * qty);
          tickets.push({ name: tt.name, qty });
        }
      }
    });

    const tax = subtotal * 0.13;
    const fee = 5.00; 
    return { subtotal, tax, fee, total: subtotal + tax + fee, tickets };
  }, [data, searchParams]);

  const handleCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    const brand = detectCardBrand(val);
    setCardBrand(brand);
    if (brand === 'Amex' && val.length > 15) return;
    if (brand !== 'Amex' && val.length > 16) return;
    setCardNumber(val);
    setLuhnError(false); 
  };

  const handleCardBlur = () => {
    if (cardNumber.length >= 13) {
      setLuhnError(!validateLuhn(cardNumber));
    }
  };

  const handlePay = async () => {
    try {
      if (!id) return;
      if (paymentMethod === 'card') {
        if (luhnError || cardNumber.length < 13) { alert('Número de tarjeta inválido.'); return; }
        if (isCardExpired(cardMonth, cardYear)) { alert('La tarjeta está vencida.'); return; }
        if (!cardName) { alert('Ingresa el nombre del titular.'); return; }
        const cvvLength = cardBrand === 'Amex' ? 4 : 3;
        if (cardCvv.length !== cvvLength) { alert(`El CVV debe tener ${cvvLength} dígitos.`); return; }
      }

      setIsLoading(true);
      const userId = user?.id || 'guest-123'; 
      const seatLabels = getSeatLabels();
      const res = await processScreeningPurchase(id, seatIds, paymentMethod, userId, invoice.total, seatLabels);
      
      sessionStorage.setItem('ticketData', JSON.stringify({ invoice, data, res, seatIds }));
      sessionStorage.removeItem('lockExpiration');
      navigate(`/booking/${id}/ticket`);
      
    } catch (err: any) {
      if (err.response?.status === 409) {
        alert('Tu reserva expiró. Volvé a elegir tus butacas.');
        navigate(`/booking/${id}/seats`);
      } else {
        setErrorMsg('Error al procesar el pago simulado.');
        setIsLoading(false);
      }
    }
  };

  if (isLoading || !data) return <div className="payment-page__loading">Procesando...</div>;

  const getSeatLabels = () => {
    return seatIds.map(sid => {
      const s = data.seats.find(x => x.id === sid);
      return s ? `${s.row}${s.col}` : '';
    }).filter(Boolean);
  };

  const expired = isCardExpired(cardMonth, cardYear);
  const btnDisabled = paymentMethod === 'card' && (expired || luhnError || !cardNumber || !cardCvv);

  return (
    <div className="payment-page">
      <div className="payment-page__bg-container">
        <div className="payment-page__bg-image" style={{ backgroundImage: `url(${data.movie.poster_url})` }} />
      </div>

      <div className="payment-page__content">
        
        <div className="booking-steps">
          <div className="step step--inactive">
            <div className="step__dot"></div>
            Asientos
          </div>
          <div className="booking-steps__line"></div>
          <div className="step step--active">
            <div className="step__dot"></div>
            Pago
          </div>
          <div className="booking-steps__line"></div>
          <div className="step step--inactive">
            <div className="step__dot"></div>
            Entradas
          </div>
        </div>

        {errorMsg && <div className="payment-page__error">{errorMsg}</div>}

        <div className="payment-layout">
          
          <div className="payment-info">
            <img src={data.movie.poster_url} className="payment-info__poster" alt="Poster" />
            <h2 className="payment-info__title">{data.movie.title}</h2>
            <div className="payment-info__meta">
              <span>{Math.floor(data.movie.duration_minutes/60)}h {data.movie.duration_minutes%60}m</span> | <span className="payment-info__rating">{data.movie.rating_classification}</span>
            </div>

            <div className="payment-info__details">
              <div><strong className="payment-info__label">Fecha y Hora</strong> {new Date(data.screening.start_time).toLocaleString('es-ES', { weekday:'short', day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}</div>
              <div><strong className="payment-info__label">Sala</strong> {data.screening.room_name}</div>
              <div><strong className="payment-info__label">Butacas Seleccionadas</strong> {getSeatLabels().join(', ')}</div>
            </div>
          </div>

          <div className="payment-form">
            <h2 className="payment-form__title">Método de pago</h2>
            
            <div className="payment-methods">
              <label className={`payment-method ${paymentMethod === 'card' ? 'payment-method--active' : ''}`}>
                <input type="radio" checked={paymentMethod === 'card'} onChange={() => setPaymentMethod('card')} className="payment-method__input" /> Tarjeta
              </label>
              <label className={`payment-method ${paymentMethod === 'qr' ? 'payment-method--active' : ''}`}>
                <input type="radio" checked={paymentMethod === 'qr'} onChange={() => setPaymentMethod('qr')} className="payment-method__input" /> Pago QR
              </label>
            </div>

            {paymentMethod === 'card' && (
              <div className="card-form">
                <div className="card-form__group">
                  <label className="card-form__label" htmlFor="cardNumber">Número de Tarjeta</label>
                  <div className="card-form__input-wrapper">
                    <input id="cardNumber" type="text" value={cardNumber} onChange={handleCardChange} onBlur={handleCardBlur} placeholder="0000 0000 0000 0000" className={`card-form__input ${luhnError ? 'card-form__input--error' : ''}`} />
                    <span className="card-form__brand">{cardBrand !== 'Unknown' ? cardBrand : '💳'}</span>
                  </div>
                  {luhnError && <span className="card-form__error-text">Número de tarjeta inválido</span>}
                </div>

                <div className="card-form__row">
                  <div className="card-form__group">
                    <p className="card-form__label" id="expiryLabel">Vencimiento (MM / AA)</p>
                    <div className="card-form__date-group" role="group" aria-labelledby="expiryLabel">
                      <input aria-label="Mes de Vencimiento" type="text" placeholder="MM" value={cardMonth} onChange={(e) => setCardMonth(e.target.value.replace(/\D/g,'').slice(0,2))} className="card-form__input card-form__input--center" />
                      <input aria-label="Año de Vencimiento" type="text" placeholder="AA" value={cardYear} onChange={(e) => setCardYear(e.target.value.replace(/\D/g,'').slice(0,2))} className="card-form__input card-form__input--center" />
                    </div>
                    {expired && <span className="card-form__error-text">La tarjeta está vencida</span>}
                  </div>
                  <div className="card-form__group">
                    <label className="card-form__label" htmlFor="cardCvv">CVV</label>
                    <input id="cardCvv" type="password" value={cardCvv} onChange={(e) => setCardCvv(e.target.value.replace(/\D/g,'').slice(0, cardBrand === 'Amex' ? 4 : 3))} placeholder={cardBrand === 'Amex' ? '1234' : '123'} className="card-form__input" />
                  </div>
                </div>

                <div className="card-form__group">
                  <label className="card-form__label" htmlFor="cardName">Nombre del Titular</label>
                  <input id="cardName" type="text" value={cardName} onChange={(e) => setCardName(e.target.value)} placeholder="COMO APARECE EN LA TARJETA" className="card-form__input card-form__input--uppercase" />
                </div>
              </div>
            )}

            {paymentMethod === 'qr' && (
              <div className="qr-payment">
                <div className="qr-payment__code">
                  <svg width="100%" height="100%" viewBox="0 0 100 100"><rect width="100%" height="100%" fill="#fff"/><rect x="10" y="10" width="30" height="30" fill="#000"/><rect x="60" y="10" width="30" height="30" fill="#000"/><rect x="10" y="60" width="30" height="30" fill="#000"/><path d="M15 15h20v20h-20zM65 15h20v20h-20zM15 65h20v20h-20zM45 10h10v10h-10zM45 25h10v35h-10zM10 45h35v10h-35zM60 45h30v10h-30zM80 60h10v30h-10zM45 70h30v10h-30zM60 85h15v5h-15z" fill="#000"/></svg>
                </div>
                <p className="qr-payment__text">Escanea este código con tu aplicación bancaria.</p>
                <h3 className="qr-payment__amount">Bs. {invoice.total.toFixed(2)}</h3>
              </div>
            )}
          </div>

          <div className="payment-summary">
            <h3 className="payment-summary__title">Resumen</h3>
            
            <div className="payment-summary__section">
              <h4 className="payment-summary__section-title">Entradas</h4>
              {invoice.tickets.map((t, i) => (
                <div key={i} className="payment-summary__row">
                  <span>{t.name} <span className="payment-summary__highlight">x{t.qty}</span></span>
                </div>
              ))}
            </div>

            <div className="payment-summary__section">
              <h4 className="payment-summary__section-title">Butacas</h4>
              <span className="payment-summary__value">{getSeatLabels().join(', ')}</span>
            </div>

            <div className="payment-summary__breakdown">
              <div className="payment-summary__row"><span>Subtotal</span><span>Bs. {invoice.subtotal.toFixed(2)}</span></div>
              <div className="payment-summary__row"><span>Impuestos (13%)</span><span>Bs. {invoice.tax.toFixed(2)}</span></div>
              <div className="payment-summary__row"><span>Comisión servicio</span><span>Bs. {invoice.fee.toFixed(2)}</span></div>
            </div>

            <div className="payment-summary__total-row">
              <span>Total</span>
              <span>Bs. {invoice.total.toFixed(2)}</span>
            </div>

            <button 
              onClick={handlePay}
              disabled={btnDisabled}
              className={`payment-summary__btn ${btnDisabled ? 'payment-summary__btn--disabled' : 'payment-summary__btn--active'}`}
            >
              {paymentMethod === 'card' ? `Pagar Bs. ${invoice.total.toFixed(2)}` : 'Confirmar pago QR'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};