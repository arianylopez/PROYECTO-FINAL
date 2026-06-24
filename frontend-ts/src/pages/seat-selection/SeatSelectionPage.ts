import Block from '../../shared/lib/block/Block';
import template from './SeatSelectionPage.hbs?raw';
import './SeatSelectionPage.css';
import { routerInstance } from '../../shared/lib/router/Router';
import { authStore } from '../../shared/store/authStore';
import { fetchScreeningSeats, lockScreeningSeats, unlockScreeningSeats, type Seat, type ScreeningSeatsResponse } from '../../features/catalog/catalogApi';

export class SeatSelectionPage extends Block {
  protected template = template;
  private screeningId: string = '';
  private timerInterval: any = null;

  constructor() {
    super({
      isLoading: true,
      errorMsgGlobal: false,
      errorMsg: '',
      data: null,
      
      purchaseSummary: {
        items: [],
        totalTickets: 0,
        totalPrice: 0
      },
      
      selectedSeats: [],
      lockTimer: null,
      lockTimerFormatted: '00:00',
      hasActiveReservation: false,
      
      renderRows: [],
      canContinue: false,
      screenDateString: '',
      screenTimeString: ''
    });
  }

  protected async componentDidMount() {
    const parts = window.location.pathname.split('/');
    this.screeningId = parts[2];

    if (!this.screeningId) {
      this.setProps({ isLoading: false, errorMsgGlobal: true });
      return;
    }

    await this.loadSeatsData();

    authStore.on('changed', () => {
      this.loadSeatsData();
    });
  }

  private async loadSeatsData() {
    this.setProps({ isLoading: true });
    try {
      const state = authStore.getState();
      const res = await fetchScreeningSeats(this.screeningId, state.user?.id);
      
      let initialSelected: Seat[] = [];
      let lockTimer: number | null = null;

      if (state.user) {
        const myLockedSeats = res.seats.filter((s: Seat) => s.status === 'locked_by_me');
        if (myLockedSeats.length > 0) {
          initialSelected = myLockedSeats;
          if (res.active_lock_ttl) {
            lockTimer = res.active_lock_ttl;
          }
        }
      }

      const screenDate = new Date(res.screening.start_time);
      const screenDateString = screenDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
      const screenTimeString = screenDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

      const durationHours = Math.floor(res.movie.duration_minutes / 60);
      const durationMins = res.movie.duration_minutes % 60;
      
      this.setProps({
        data: {
          ...res,
          movie: {
            ...res.movie,
            durationHours,
            durationMins
          }
        },
        screenDateString,
        screenTimeString,
        selectedSeats: initialSelected,
        lockTimer,
        hasActiveReservation: lockTimer !== null && lockTimer > 0 && initialSelected.length > 0,
        errorMsgGlobal: false
      });

      this.startTimer();
      this.updatePurchaseSummary();
      this.buildRenderRows();

    } catch (err: any) {
      this.setProps({ errorMsgGlobal: true });
    } finally {
      this.setProps({ isLoading: false });
    }
  }

  private startTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    if (this.props.lockTimer === null || this.props.lockTimer <= 0) return;

    this.updateTimerFormatted();
    this.timerInterval = setInterval(() => {
      let t = this.props.lockTimer - 1;
      if (t <= 0) {
        t = 0;
        clearInterval(this.timerInterval);
        this.setProps({ lockTimer: 0, hasActiveReservation: false, selectedSeats: [] });
        this.loadSeatsData(); 
      } else {
        this.setProps({ lockTimer: t });
        this.updateTimerFormatted();
      }
    }, 1000);
  }

  private updateTimerFormatted() {
    const t = this.props.lockTimer;
    if (t === null || t < 0) return;
    const mins = Math.floor(t / 60);
    const secs = t % 60;
    const formatted = `${mins}:${secs.toString().padStart(2, '0')}`;
    const timerDisplay = this.element?.querySelector('#lock-timer-display');
    if (timerDisplay) {
      timerDisplay.innerHTML = formatted;
    } else {
      this.setProps({ lockTimerFormatted: formatted });
    }
  }

  private updatePurchaseSummary() {
    if (!this.props.data) return;

    const searchParams = new URLSearchParams(window.location.search);
    const data: ScreeningSeatsResponse = this.props.data;
    const selectedSeats: Seat[] = this.props.selectedSeats;
    
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

    if (totalTickets === 0 && selectedSeats.length > 0) {
      totalTickets = selectedSeats.length; 
    }

    const canContinue = selectedSeats.length === totalTickets && totalTickets > 0;

    this.setProps({
      purchaseSummary: { items, totalTickets, totalPrice },
      canContinue
    });
  }

  private buildRenderRows() {
    if (!this.props.data) return;

    const data: ScreeningSeatsResponse = this.props.data;
    const selectedSeats: Seat[] = this.props.selectedSeats;
    const hasActiveReservation = this.props.hasActiveReservation;

    const rows = Array.from(new Set(data.seats.map(s => s.row))).sort();
    
    const renderRows = rows.map(row => {
      const rowSeats = data.seats
        .filter(s => s.row === row)
        .sort((a, b) => a.col - b.col)
        .map(seat => {
          if (seat.type === 'corridor') {
            return { isCorridor: true };
          }

          const isSelected = selectedSeats.some(s => s.id === seat.id);
          
          let bgColor = '#e5e7eb'; 
          let fontColor = '#000000';
          let cursor = hasActiveReservation ? 'not-allowed' : 'pointer';
          let borderColor = '';
          let showLabel = true;

          if (seat.status === 'locked' && !isSelected) {
            bgColor = '#14532d'; 
            fontColor = '#ffffff';
            cursor = 'not-allowed';
            showLabel = false;
          } else if (seat.status === 'sold') {
            bgColor = '#374151'; 
            fontColor = '#9ca3af';
            cursor = 'not-allowed';
            showLabel = false;
          } else if (isSelected || seat.status === 'locked_by_me') {
            bgColor = '#f4e951'; 
            fontColor = '#000000';
            borderColor = '#ca8a04';
            showLabel = true;
          }

          return {
            ...seat,
            isCorridor: false,
            bgColor,
            fontColor,
            cursor,
            borderColor,
            showLabel,
            opacity: (hasActiveReservation && !isSelected) ? 0.4 : 1
          };
        });

      return { row, seats: rowSeats };
    });

    this.setProps({ renderRows });
  }

  private toggleSeat(seatId: string) {
    if (this.props.hasActiveReservation) {
      alert("Ya tienes una reserva en curso. Utiliza el botón 'Cancelar Reserva' si deseas cambiar de asientos.");
      return;
    }

    const data: ScreeningSeatsResponse = this.props.data;
    const seat = data.seats.find(s => s.id === seatId);
    if (!seat || seat.status !== 'available' || seat.type === 'corridor') return;

    let selectedSeats: Seat[] = [...this.props.selectedSeats];
    const isSelected = selectedSeats.some(s => s.id === seat.id);

    if (isSelected) {
      selectedSeats = selectedSeats.filter(s => s.id !== seat.id);
    } else {
      if (selectedSeats.length >= this.props.purchaseSummary.totalTickets) {
        alert(`Solo puedes seleccionar ${this.props.purchaseSummary.totalTickets} asientos.`);
        return;
      }
      selectedSeats.push(seat);
    }

    this.setProps({ selectedSeats });
    this.updatePurchaseSummary();
    this.buildRenderRows();
  }

  private async handleLockSeats() {
    const state = authStore.getState();
    if (!state.user) {
      alert("Debes iniciar sesión para poder reservar butacas.");
      routerInstance.go('/login');
      return;
    }

    this.setProps({ errorMsg: '' });
    
    try {
      const seatIds = this.props.selectedSeats.map((s: Seat) => s.id);
      const res = await lockScreeningSeats(this.screeningId, seatIds, state.user.id);
      
      sessionStorage.setItem('lockExpiration', (Date.now() + res.expires_in_seconds * 1000).toString());
      
      const searchParams = new URLSearchParams(window.location.search);
      const seatQuery = seatIds.join(',');
      
      routerInstance.go(`/booking/${this.screeningId}/payment?${searchParams.toString()}&seats=${seatQuery}`);

    } catch (err: any) {
      if (err.response?.status === 409) {
        alert(err.response.data.detail);
        this.loadSeatsData(); 
      } else {
        this.setProps({ errorMsg: err.response?.data?.detail || 'Error en la reserva.' });
      }
    }
  }

  private async handleCancelReservation() {
    const state = authStore.getState();
    if (!state.user || !this.screeningId) return;
    
    const confirmChoice = window.confirm("¿Estás seguro que quieres cancelar tu reserva y liberar estos asientos?");
    if (!confirmChoice) return;
    
    try {
        await unlockScreeningSeats(this.screeningId, state.user.id);
        sessionStorage.removeItem('lockExpiration');
        this.loadSeatsData(); 
    } catch (err) {
        alert("Error de conexión al liberar asientos.");
    }
  }

  private handleContinuePayment() {
    const searchParams = new URLSearchParams(window.location.search);
    const seatQuery = this.props.selectedSeats.map((s: Seat) => s.id).join(',');
    routerInstance.go(`/booking/${this.screeningId}/payment?${searchParams.toString()}&seats=${seatQuery}`);
  }

  protected events = {
    click: (e: Event) => {
      const target = e.target as HTMLElement;

      const seatItem = target.closest('.seat-item');
      if (seatItem) {
        const id = seatItem.getAttribute('data-id');
        if (id) {
          this.toggleSeat(id);
        }
        return;
      }

      if (target.id === 'btn-lock-seats') {
        if (!target.hasAttribute('disabled')) {
          this.handleLockSeats();
        }
        return;
      }

      if (target.id === 'btn-continue-payment') {
        this.handleContinuePayment();
        return;
      }

      if (target.id === 'btn-cancel-reservation') {
        this.handleCancelReservation();
        return;
      }

      if (target.id === 'btn-go-back') {
        window.history.back();
        return;
      }
    }
  };
}
