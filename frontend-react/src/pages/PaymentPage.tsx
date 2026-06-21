import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { fetchScreeningSeats, processScreeningPurchase, type ScreeningSeatsResponse } from '../features/catalog/catalogApi';
import { useAuthStore } from '../shared/store/authStore';

const validateLuhn = (num: string): boolean => {
  let arr = (num + '').replace(/\D/g, '').split('').reverse().map(x => parseInt(x, 10));
  if (arr.length < 13) return false;
  let lastDigit = arr.shift()!;
  let sum = arr.reduce((acc, val, i) => (i % 2 !== 0 ? acc + val : acc + ((val * 2) % 9) || 9), 0);
  return (sum + lastDigit) % 10 === 0;
};

const detectCardBrand = (num: string): string => {
  const str = num.replace(/\D/g, '');
  if (/^4/.test(str)) return 'Visa';
  if (/^(5[1-5]|2[2-7])/.test(str)) return 'MasterCard';
  if (/^3[47]/.test(str)) return 'Amex';
  if (/^(6011|65)/.test(str)) return 'Discover';
  return 'Unknown';
};

const isCardExpired = (month: string, year: string): boolean => {
  if (!month || !year) return false;
  const now = new Date();
  const currentYear = now.getFullYear() % 100;
  const currentMonth = now.getMonth() + 1;
  const expY = parseInt(year, 10);
  const expM = parseInt(month, 10);
  return expY < currentYear || (expY === currentYear && expM < currentMonth);
};

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

  if (isLoading || !data) return <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f1115', color: '#f4e951' }}>Procesando...</div>;

  const getSeatLabels = () => {
    return seatIds.map(sid => {
      const s = data.seats.find(x => x.id === sid);
      return s ? `${s.row}${s.col}` : '';
    }).filter(Boolean);
  };

  const expired = isCardExpired(cardMonth, cardYear);
  const btnDisabled = paymentMethod === 'card' && (expired || luhnError || !cardNumber || !cardCvv);

  return (
    <div style={{ position: 'relative', minHeight: '100vh', color: '#ffffff', fontFamily: '"Inter", system-ui, sans-serif' }}>
      <div style={{ position: 'fixed', inset: 0, zIndex: -1 }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${data.movie.poster_url})`, backgroundSize: 'cover', filter: 'blur(40px) brightness(0.2)' }} />
      </div>

      <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '2rem' }}>
        
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '2rem', marginBottom: '3rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#6b7280', fontWeight: 'bold' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#6b7280', marginBottom: '0.5rem' }}></div>
            Asientos
          </div>
          <div style={{ width: '80px', height: '2px', backgroundColor: '#f4e951' }}></div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#f4e951', fontWeight: 'bold' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#f4e951', marginBottom: '0.5rem', boxShadow: '0 0 10px #f4e951' }}></div>
            Pago
          </div>
          <div style={{ width: '80px', height: '2px', backgroundColor: '#374151' }}></div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#6b7280', fontWeight: 'bold' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#374151', marginBottom: '0.5rem' }}></div>
            Entradas
          </div>
        </div>

        {errorMsg && <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '1rem', borderRadius: '8px', marginBottom: '2rem', border: '1px solid #991b1b', textAlign: 'center' }}>{errorMsg}</div>}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2.5rem', alignItems: 'stretch' }}>
          
          <div style={{ flex: '1 1 250px', backgroundColor: 'rgba(23, 26, 33, 0.6)', border: '1px solid #262932', borderRadius: '16px', padding: '2rem', backdropFilter: 'blur(10px)' }}>
            <img src={data.movie.poster_url} style={{ width: '100px', borderRadius: '8px', marginBottom: '1rem' }} alt="Poster" />
            <h2 style={{ fontSize: '1.5rem', fontWeight: '900', margin: '0 0 0.5rem', textTransform: 'uppercase' }}>{data.movie.title}</h2>
            <div style={{ display: 'flex', gap: '0.5rem', color: '#9ca3af', fontSize: '0.85rem', marginBottom: '2rem' }}>
              <span>{Math.floor(data.movie.duration_minutes/60)}h {data.movie.duration_minutes%60}m</span> | <span style={{ border: '1px solid #4b5563', padding: '0 2px' }}>{data.movie.rating_classification}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', color: '#e5e7eb', fontSize: '0.95rem' }}>
              <div><strong style={{ color: '#9ca3af', display: 'block', fontSize: '0.8rem' }}>Fecha y Hora</strong> {new Date(data.screening.start_time).toLocaleString('es-ES', { weekday:'short', day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}</div>
              <div><strong style={{ color: '#9ca3af', display: 'block', fontSize: '0.8rem' }}>Sala</strong> {data.screening.room_name}</div>
              <div><strong style={{ color: '#9ca3af', display: 'block', fontSize: '0.8rem' }}>Butacas Seleccionadas</strong> {getSeatLabels().join(', ')}</div>
            </div>
          </div>

          <div style={{ flex: '2 1 400px', backgroundColor: '#171a21', border: '1px solid #262932', borderRadius: '16px', padding: '2.5rem', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '900', marginBottom: '1.5rem' }}>Método de pago</h2>
            
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
              <label style={{ flex: 1, padding: '1rem', border: `2px solid ${paymentMethod === 'card' ? '#f4e951' : '#374151'}`, borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: paymentMethod === 'card' ? 'rgba(244, 233, 81, 0.05)' : 'transparent' }}>
                <input type="radio" checked={paymentMethod === 'card'} onChange={() => setPaymentMethod('card')} style={{ accentColor: '#f4e951' }} /> Tarjeta
              </label>
              <label style={{ flex: 1, padding: '1rem', border: `2px solid ${paymentMethod === 'qr' ? '#f4e951' : '#374151'}`, borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: paymentMethod === 'qr' ? 'rgba(244, 233, 81, 0.05)' : 'transparent' }}>
                <input type="radio" checked={paymentMethod === 'qr'} onChange={() => setPaymentMethod('qr')} style={{ accentColor: '#f4e951' }} /> Pago QR
              </label>
            </div>

            {paymentMethod === 'card' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', color: '#9ca3af', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Número de Tarjeta</label>
                  <div style={{ position: 'relative' }}>
                    <input type="text" value={cardNumber} onChange={handleCardChange} onBlur={handleCardBlur} placeholder="0000 0000 0000 0000" style={{ width: '100%', padding: '1rem', backgroundColor: '#0f1115', border: `1px solid ${luhnError ? '#ef4444' : '#374151'}`, borderRadius: '8px', color: '#fff', outline: 'none', fontSize: '1.1rem' }} />
                    <span style={{ position: 'absolute', right: '15px', top: '15px', color: '#f4e951', fontWeight: 'bold' }}>{cardBrand !== 'Unknown' ? cardBrand : '💳'}</span>
                  </div>
                  {luhnError && <span style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.4rem', display: 'block' }}>Número de tarjeta inválido</span>}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', color: '#9ca3af', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Vencimiento (MM / AA)</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input type="text" placeholder="MM" value={cardMonth} onChange={(e) => setCardMonth(e.target.value.replace(/\D/g,'').slice(0,2))} style={{ width: '100%', padding: '1rem', backgroundColor: '#0f1115', border: '1px solid #374151', borderRadius: '8px', color: '#fff', textAlign: 'center' }} />
                      <input type="text" placeholder="AA" value={cardYear} onChange={(e) => setCardYear(e.target.value.replace(/\D/g,'').slice(0,2))} style={{ width: '100%', padding: '1rem', backgroundColor: '#0f1115', border: '1px solid #374151', borderRadius: '8px', color: '#fff', textAlign: 'center' }} />
                    </div>
                    {expired && <span style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.4rem', display: 'block' }}>La tarjeta está vencida</span>}
                  </div>
                  <div>
                    <label style={{ display: 'block', color: '#9ca3af', marginBottom: '0.5rem', fontSize: '0.9rem' }}>CVV</label>
                    <input type="password" value={cardCvv} onChange={(e) => setCardCvv(e.target.value.replace(/\D/g,'').slice(0, cardBrand === 'Amex' ? 4 : 3))} placeholder={cardBrand === 'Amex' ? '1234' : '123'} style={{ width: '100%', padding: '1rem', backgroundColor: '#0f1115', border: '1px solid #374151', borderRadius: '8px', color: '#fff' }} />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', color: '#9ca3af', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Nombre del Titular</label>
                  <input type="text" value={cardName} onChange={(e) => setCardName(e.target.value)} placeholder="COMO APARECE EN LA TARJETA" style={{ width: '100%', padding: '1rem', backgroundColor: '#0f1115', border: '1px solid #374151', borderRadius: '8px', color: '#fff', textTransform: 'uppercase' }} />
                </div>
              </div>
            )}

            {paymentMethod === 'qr' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: '#0f1115', padding: '3rem', borderRadius: '12px', border: '1px solid #374151' }}>
                <div style={{ width: '200px', height: '200px', backgroundColor: '#fff', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '10px', borderRadius: '8px' }}>
                  <svg width="100%" height="100%" viewBox="0 0 100 100"><rect width="100%" height="100%" fill="#fff"/><rect x="10" y="10" width="30" height="30" fill="#000"/><rect x="60" y="10" width="30" height="30" fill="#000"/><rect x="10" y="60" width="30" height="30" fill="#000"/><path d="M15 15h20v20h-20zM65 15h20v20h-20zM15 65h20v20h-20zM45 10h10v10h-10zM45 25h10v35h-10zM10 45h35v10h-35zM60 45h30v10h-30zM80 60h10v30h-10zM45 70h30v10h-30zM60 85h15v5h-15z" fill="#000"/></svg>
                </div>
                <p style={{ marginTop: '1.5rem', color: '#9ca3af', fontSize: '0.9rem' }}>Escanea este código con tu aplicación bancaria.</p>
                <h3 style={{ margin: '0.5rem 0 0', fontSize: '1.8rem', color: '#f4e951' }}>Bs. {invoice.total.toFixed(2)}</h3>
              </div>
            )}
          </div>

          <div style={{ flex: '1 1 250px', backgroundColor: 'rgba(23, 26, 33, 0.6)', border: '1px solid #262932', borderRadius: '16px', padding: '2rem', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '900', marginBottom: '1.5rem', borderBottom: '1px solid #374151', paddingBottom: '0.8rem' }}>Resumen</h3>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ color: '#9ca3af', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Entradas</h4>
              {invoice.tickets.map((t, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', marginBottom: '0.3rem' }}>
                  <span>{t.name} <span style={{ color: '#f4e951' }}>x{t.qty}</span></span>
                </div>
              ))}
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <h4 style={{ color: '#9ca3af', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Butacas</h4>
              <span style={{ fontSize: '0.95rem', fontWeight: 'bold' }}>{getSeatLabels().join(', ')}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', color: '#9ca3af', fontSize: '0.9rem', marginBottom: '1.5rem', borderBottom: '1px solid #374151', paddingBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Subtotal</span><span>Bs. {invoice.subtotal.toFixed(2)}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Impuestos (13%)</span><span>Bs. {invoice.tax.toFixed(2)}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Comisión servicio</span><span>Bs. {invoice.fee.toFixed(2)}</span></div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.5rem', fontWeight: '900', color: '#ffffff', marginBottom: '2rem' }}>
              <span>Total</span>
              <span>Bs. {invoice.total.toFixed(2)}</span>
            </div>

            <button 
              onClick={handlePay}
              disabled={btnDisabled}
              style={{ width: '100%', padding: '1.25rem', borderRadius: '8px', border: 'none', backgroundColor: btnDisabled ? '#374151' : '#f4e951', color: btnDisabled ? '#9ca3af' : '#000', fontWeight: '900', textTransform: 'uppercase', fontSize: '1rem', cursor: btnDisabled ? 'not-allowed' : 'pointer', transition: 'background-color 0.2s' }}
            >
              {paymentMethod === 'card' ? `Pagar Bs. ${invoice.total.toFixed(2)}` : 'Confirmar pago QR'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};