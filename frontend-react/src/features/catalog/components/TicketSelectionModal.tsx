import React, { useState, useEffect, useMemo } from 'react';
import { type TicketType } from '../catalogApi';

interface TicketSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: (selectedTickets: Record<string, number>) => void;
  ticketTypes: TicketType[];
  screeningTime: string;
  screeningRoom: string;
}

export const TicketSelectionModal: React.FC<TicketSelectionModalProps> = ({ 
  isOpen, 
  onClose, 
  onContinue,
  ticketTypes,
  screeningTime,
  screeningRoom
}) => {
  const [ticketCounts, setTicketCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (isOpen && ticketTypes.length > 0) {
      const initialCounts: Record<string, number> = {};
      ticketTypes.forEach(type => {
        initialCounts[type.id] = 0;
      });
      setTicketCounts(initialCounts);
    }
  }, [isOpen, ticketTypes]);

  const handleIncrement = (id: string) => {
    setTicketCounts(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  };

  const handleDecrement = (id: string) => {
    setTicketCounts(prev => ({ ...prev, [id]: Math.max(0, (prev[id] || 0) - 1) }));
  };

  const { totalTickets, totalPrice } = useMemo(() => {
    let count = 0;
    let price = 0;
    ticketTypes.forEach(type => {
      const qty = ticketCounts[type.id] || 0;
      count += qty;
      price += qty * type.price;
    });
    return { totalTickets: count, totalPrice: price };
  }, [ticketCounts, ticketTypes]);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center',
      alignItems: 'center', zIndex: 1000, padding: '1.5rem'
    }}>
      <div style={{
        backgroundColor: '#171a21', width: '100%', maxWidth: '580px',
        borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
        overflow: 'hidden', border: '1px solid #262932', display: 'flex', flexDirection: 'column'
      }}>
        
        {/* Encabezado del Modal */}
        <div style={{ padding: '1.75rem', borderBottom: '1px solid #262932', backgroundColor: '#1e222b' }}>
          <h2 style={{ margin: 0, color: '#f4e951', fontSize: '1.4rem', fontWeight: '900', letterSpacing: '0.5px' }}>
            🎟️ SELECCIONA TUS ENTRADAS
          </h2>
          <p style={{ color: '#9ca3af', margin: '0.4rem 0 0 0', fontSize: '0.95rem' }}>
            Función: <strong style={{ color: '#fff' }}>{screeningTime}</strong> • Sala: <strong style={{ color: '#fff' }}>{screeningRoom}</strong>
          </p>
        </div>

        <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', maxHeight: '350px', overflowY: 'auto' }}>
          {ticketTypes.map(type => {
            const currentQty = ticketCounts[type.id] || 0;
            return (
              <div key={type.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1f222b', padding: '1rem 1.25rem', borderRadius: '12px', border: '1px solid #262932' }}>
                <div>
                  <h4 style={{ margin: '0 0 0.2rem 0', color: '#ffffff', fontSize: '1.1rem', fontWeight: '700' }}>{type.name}</h4>
                  <span style={{ color: '#9ca3af', fontSize: '0.95rem' }}>Bs. {type.price.toFixed(2)}</span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', backgroundColor: '#0f1115', padding: '0.4rem 0.8rem', borderRadius: '8px', border: '1px solid #374151' }}>
                  <button 
                    onClick={() => handleDecrement(type.id)}
                    disabled={currentQty === 0}
                    style={{
                      width: '30px', height: '32px', borderRadius: '4px', border: 'none',
                      backgroundColor: currentQty === 0 ? 'transparent' : '#374151',
                      color: currentQty === 0 ? '#4b5563' : '#f4e951',
                      cursor: currentQty === 0 ? 'not-allowed' : 'pointer',
                      fontSize: '1.3rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                  >
                    −
                  </button>
                  <span style={{ color: '#ffffff', fontWeight: '900', fontSize: '1.1rem', width: '24px', textAlign: 'center' }}>
                    {currentQty}
                  </span>
                  <button 
                    onClick={() => handleIncrement(type.id)}
                    style={{
                      width: '30px', height: '32px', borderRadius: '4px', border: 'none',
                      backgroundColor: '#374151', color: '#f4e951', cursor: 'pointer',
                      fontSize: '1.3rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ padding: '1.25rem 2rem', backgroundColor: '#0f1115', borderTop: '1px solid #262932', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.95rem' }}>
          <span style={{ color: '#9ca3af' }}>Total boletos: <strong style={{ color: '#ffffff' }}>{totalTickets}</strong></span>
          <span style={{ color: '#9ca3af' }}>Total a pagar: <strong style={{ color: '#f4e951', fontSize: '1.25rem' }}>Bs. {totalPrice.toFixed(2)}</strong></span>
        </div>

        <div style={{ padding: '1.5rem 2rem', display: 'flex', gap: '1.25rem', backgroundColor: '#1e222b', borderTop: '1px solid #262932' }}>
          <button 
            onClick={onClose}
            style={{ flex: 1, padding: '1rem', backgroundColor: 'transparent', color: '#9ca3af', border: '1px solid #4b5563', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseOver={(e) => e.currentTarget.style.color = '#fff'}
            onFocus={(e) => e.currentTarget.style.color = '#fff'}
            onMouseOut={(e) => e.currentTarget.style.color = '#9ca3af'}
            onBlur={(e) => e.currentTarget.style.color = '#9ca3af'}
          >
            Cancelar
          </button>
          <button 
            onClick={() => onContinue(ticketCounts)}
            disabled={totalTickets === 0}
            style={{ 
              flex: 1, padding: '1rem', borderRadius: '8px', border: 'none', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.5px',
              backgroundColor: totalTickets === 0 ? '#262932' : '#f4e951',
              color: totalTickets === 0 ? '#4b5563' : '#0f1115',
              cursor: totalTickets === 0 ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s'
            }}
          >
            Continuar
          </button>
        </div>

      </div>
    </div>
  );
};