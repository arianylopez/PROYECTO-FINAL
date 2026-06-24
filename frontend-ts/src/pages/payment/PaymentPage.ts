import Block from '../../shared/lib/block/Block';
import template from './PaymentPage.hbs?raw';
import { routerInstance } from '../../shared/lib/router/Router';
import { authStore } from '../../shared/store/authStore';
import { fetchScreeningSeats, processScreeningPurchase, type ScreeningSeatsResponse } from '../../features/catalog/catalogApi';
import { validateLuhn, detectCardBrand, isCardExpired } from '../../shared/utils/cardUtils';

export class PaymentPage extends Block {
  protected template = template;
  private screeningId: string = '';
  private timerInterval: any = null;

  constructor() {
    super({
      isLoading: true,
      errorMsg: '',
      data: null,
      
      paymentMethod: 'card',
      cardNumber: '',
      cardMonth: '',
      cardYear: '',
      cardCvv: '',
      cardName: '',
      
      cardBrand: 'Unknown',
      luhnError: false,
      expired: false,
      btnDisabled: true,

      durationHours: 0,
      durationMins: 0,
      screenDateFormatted: '',
      seatLabelsString: '',

      invoice: {
        subtotal: 0,
        tax: 0,
        fee: 0,
        total: 0,
        tickets: []
      }
    });
  }

  protected async componentDidMount() {
    const parts = window.location.pathname.split('/');
    this.screeningId = parts[2];

    if (!this.screeningId) {
      this.setProps({ isLoading: false, errorMsg: 'ID de función no proporcionado.' });
      return;
    }

    try {
      const res = await fetchScreeningSeats(this.screeningId);
      
      const searchParams = new URLSearchParams(window.location.search);
      const seatIds = searchParams.get('seats')?.split(',') || [];
      
      const seatLabels = seatIds.map(sid => {
        const s = res.seats.find((x: any) => x.id === sid);
        return s ? `${s.row}${s.col}` : '';
      }).filter(Boolean);

      let subtotal = 0;
      const tickets: any[] = [];
      Array.from(searchParams.entries()).forEach(([key, val]) => {
        if (key !== 'seats') {
          const qty = parseInt(val);
          const tt = res.ticket_types.find((t: any) => t.id === key);
          if (tt && qty > 0) {
            subtotal += (tt.price * qty);
            tickets.push({ name: tt.name, qty });
          }
        }
      });
      const tax = subtotal * 0.13;
      const fee = 5.00;
      const invoice = { subtotal, tax, fee, total: subtotal + tax + fee, tickets };

      const screenDate = new Date(res.screening.start_time);

      this.setProps({
        data: res,
        isLoading: false,
        durationHours: Math.floor(res.movie.duration_minutes / 60),
        durationMins: res.movie.duration_minutes % 60,
        screenDateFormatted: screenDate.toLocaleString('es-ES', { weekday:'short', day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' }),
        seatLabelsString: seatLabels.join(', '),
        invoice
      });

      this.checkExpiration();
      this.timerInterval = setInterval(() => this.checkExpiration(), 5000);

      this.updateBtnState();

    } catch (err) {
      console.error(err);
      this.setProps({ isLoading: false, errorMsg: 'Error al cargar los datos.' });
    }
  }

  private checkExpiration() {
    const exp = sessionStorage.getItem('lockExpiration');
    if (exp && Date.now() > parseInt(exp)) {
      alert('Tu reserva expiró. Volvé a elegir tus butacas.');
      routerInstance.go(`/booking/${this.screeningId}/seats`);
    }
  }

  private updateBtnState() {
    const { paymentMethod, cardNumber, cardMonth, cardYear, cardCvv, luhnError } = this.props;
    const expired = isCardExpired(cardMonth, cardYear);
    const btnDisabled = paymentMethod === 'card' && (expired || luhnError || !cardNumber || !cardCvv);
    
    this.setProps({ expired, btnDisabled });
  }

  protected events = {
    change: (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (target.name === 'payment-method') {
        this.setProps({ paymentMethod: target.value });
        this.updateBtnState();
      }
    },
    input: (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (target.id === 'card-number') {
        const val = target.value.replace(/\D/g, '');
        const brand = detectCardBrand(val);
        if (brand === 'Amex' && val.length > 15) return;
        if (brand !== 'Amex' && val.length > 16) return;
        this.setProps({ cardNumber: val, cardBrand: brand, luhnError: false });
        this.updateBtnState();
      }
      if (target.id === 'card-month') {
        this.setProps({ cardMonth: target.value.replace(/\D/g, '').slice(0, 2) });
        this.updateBtnState();
      }
      if (target.id === 'card-year') {
        this.setProps({ cardYear: target.value.replace(/\D/g, '').slice(0, 2) });
        this.updateBtnState();
      }
      if (target.id === 'card-cvv') {
        const length = this.props.cardBrand === 'Amex' ? 4 : 3;
        this.setProps({ cardCvv: target.value.replace(/\D/g, '').slice(0, length) });
        this.updateBtnState();
      }
      if (target.id === 'card-name') {
        this.props.cardName = target.value; // silent store
      }
    },
    focusout: (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (target.id === 'card-number') {
        if (this.props.cardNumber.length >= 13) {
          this.setProps({ luhnError: !validateLuhn(this.props.cardNumber) });
          this.updateBtnState();
        }
      }
    },
    click: async (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.id === 'btn-pay') {
        if (target.hasAttribute('disabled')) return;
        
        if (this.props.paymentMethod === 'card') {
          if (this.props.luhnError || this.props.cardNumber.length < 13) { alert('Número de tarjeta inválido.'); return; }
          if (isCardExpired(this.props.cardMonth, this.props.cardYear)) { alert('La tarjeta está vencida.'); return; }
          if (!this.props.cardName) { alert('Ingresa el nombre del titular.'); return; }
          const cvvLength = this.props.cardBrand === 'Amex' ? 4 : 3;
          if (this.props.cardCvv.length !== cvvLength) { alert(`El CVV debe tener ${cvvLength} dígitos.`); return; }
        }

        this.setProps({ isLoading: true });
        
        try {
          const state = authStore.getState();
          const userId = state.user?.id || 'guest-123';
          
          const searchParams = new URLSearchParams(window.location.search);
          const seatIds = searchParams.get('seats')?.split(',') || [];
          const seatLabels = seatIds.map(sid => {
            const s = this.props.data.seats.find((x: any) => x.id === sid);
            return s ? `${s.row}${s.col}` : '';
          }).filter(Boolean);

          const res = await processScreeningPurchase(
            this.screeningId, 
            seatIds, 
            this.props.paymentMethod, 
            userId, 
            this.props.invoice.total, 
            seatLabels
          );

          sessionStorage.setItem('ticketData', JSON.stringify({ 
            invoice: this.props.invoice, 
            data: this.props.data, 
            res, 
            seatIds 
          }));
          sessionStorage.removeItem('lockExpiration');
          
          if (this.timerInterval) clearInterval(this.timerInterval);
          
          routerInstance.go(`/booking/${this.screeningId}/ticket`);
        } catch (err: any) {
          if (err.response?.status === 409) {
            alert('Tu reserva expiró. Volvé a elegir tus butacas.');
            routerInstance.go(`/booking/${this.screeningId}/seats`);
          } else {
            this.setProps({ errorMsg: 'Error al procesar el pago simulado.', isLoading: false });
          }
        }
      }
    }
  };
}
