import Block from '../../shared/lib/block/Block';
import template from './PaymentPage.hbs?raw';
import './PaymentPage.css';
import { routerInstance } from '../../shared/lib/router/Router';
import { authStore } from '../../shared/store/authStore';
import { fetchScreeningSeats, processScreeningPurchase } from '../../features/catalog/catalogApi';
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
    if (this.props.paymentMethod !== 'card') {
      this.updateDOMBtn(false);
      return;
    }

    const cardNumEl = this.element?.querySelector('#card-number') as HTMLInputElement;
    const cardMonthEl = this.element?.querySelector('#card-month') as HTMLInputElement;
    const cardYearEl = this.element?.querySelector('#card-year') as HTMLInputElement;
    const cardCvvEl = this.element?.querySelector('#card-cvv') as HTMLInputElement;

    const cardNumber = cardNumEl?.value.replace(/\\D/g, '') || '';
    const cardMonth = cardMonthEl?.value.replace(/\\D/g, '') || '';
    const cardYear = cardYearEl?.value.replace(/\\D/g, '') || '';
    const cardCvv = cardCvvEl?.value.replace(/\\D/g, '') || '';
    
    let luhnError = false;
    if (cardNumber.length >= 13) {
      luhnError = !validateLuhn(cardNumber);
    }
    
    const expired = isCardExpired(cardMonth, cardYear);

    const luhnErrorEl = this.element?.querySelector('#card-luhn-error');
    if (luhnErrorEl) luhnErrorEl.setAttribute('style', `color: #ef4444; font-size: 0.8rem; margin-top: 0.4rem; display: ${luhnError ? 'block' : 'none'};`);
    
    if (cardNumEl) cardNumEl.style.borderColor = luhnError ? '#ef4444' : '#374151';

    const expiredErrorEl = this.element?.querySelector('#card-expired-error');
    if (expiredErrorEl) expiredErrorEl.setAttribute('style', `color: #ef4444; font-size: 0.8rem; margin-top: 0.4rem; display: ${expired ? 'block' : 'none'};`);

    const btnDisabled = expired || luhnError || !cardNumber || !cardCvv;
    this.updateDOMBtn(btnDisabled);
  }

  private updateDOMBtn(disabled: boolean) {
    const btn = this.element?.querySelector('#btn-pay') as HTMLButtonElement;
    if (btn) {
      if (disabled) {
        btn.setAttribute('disabled', 'true');
        btn.style.backgroundColor = '#374151';
        btn.style.color = '#9ca3af';
        btn.style.cursor = 'not-allowed';
      } else {
        btn.removeAttribute('disabled');
        btn.style.backgroundColor = '#f4e951';
        btn.style.color = '#000';
        btn.style.cursor = 'pointer';
      }
    }
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
        const val = target.value.replace(/\\D/g, '');
        const brand = detectCardBrand(val);
        if (brand === 'Amex' && val.length > 15) target.value = val.slice(0, 15);
        else if (brand !== 'Amex' && val.length > 16) target.value = val.slice(0, 16);
        else target.value = val;
        
        const brandSpan = this.element?.querySelector('#card-brand-display');
        if (brandSpan) brandSpan.textContent = brand !== 'Unknown' ? brand : '💳';
        
        const cvvInput = this.element?.querySelector('#card-cvv') as HTMLInputElement;
        if (cvvInput) {
          cvvInput.placeholder = brand === 'Amex' ? '1234' : '123';
          if (brand === 'Amex' && cvvInput.value.length > 4) cvvInput.value = cvvInput.value.slice(0, 4);
          if (brand !== 'Amex' && cvvInput.value.length > 3) cvvInput.value = cvvInput.value.slice(0, 3);
        }
      }
      if (target.id === 'card-month') target.value = target.value.replace(/\\D/g, '').slice(0, 2);
      if (target.id === 'card-year') target.value = target.value.replace(/\\D/g, '').slice(0, 2);
      if (target.id === 'card-cvv') {
        const cardNumEl = this.element?.querySelector('#card-number') as HTMLInputElement;
        const brand = detectCardBrand(cardNumEl ? cardNumEl.value.replace(/\\D/g, '') : '');
        const length = brand === 'Amex' ? 4 : 3;
        target.value = target.value.replace(/\\D/g, '').slice(0, length);
      }
      this.updateBtnState();
    },
    focusout: (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (target.id === 'card-number') {
        this.updateBtnState();
      }
    },
    click: async (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.id === 'btn-pay') {
        if (target.hasAttribute('disabled')) return;
        
        if (this.props.paymentMethod === 'card') {
          const cardNumEl = this.element?.querySelector('#card-number') as HTMLInputElement;
          const cardMonthEl = this.element?.querySelector('#card-month') as HTMLInputElement;
          const cardYearEl = this.element?.querySelector('#card-year') as HTMLInputElement;
          const cardCvvEl = this.element?.querySelector('#card-cvv') as HTMLInputElement;
          const cardNameEl = this.element?.querySelector('#card-name') as HTMLInputElement;
          
          const cardNumber = cardNumEl?.value.replace(/\\D/g, '') || '';
          const cardMonth = cardMonthEl?.value.replace(/\\D/g, '') || '';
          const cardYear = cardYearEl?.value.replace(/\\D/g, '') || '';
          const cardCvv = cardCvvEl?.value.replace(/\\D/g, '') || '';
          const cardName = cardNameEl?.value || '';
          
          let luhnError = false;
          if (cardNumber.length >= 13) luhnError = !validateLuhn(cardNumber);

          if (luhnError || cardNumber.length < 13) { alert('Número de tarjeta inválido.'); return; }
          if (isCardExpired(cardMonth, cardYear)) { alert('La tarjeta está vencida.'); return; }
          if (!cardName) { alert('Ingresa el nombre del titular.'); return; }
          const brand = detectCardBrand(cardNumber);
          const cvvLength = brand === 'Amex' ? 4 : 3;
          if (cardCvv.length !== cvvLength) { alert(`El CVV debe tener ${cvvLength} dígitos.`); return; }
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
