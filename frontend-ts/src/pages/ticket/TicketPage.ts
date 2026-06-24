import Block from '../../shared/lib/block/Block';
import template from './TicketPage.hbs?raw';
import './TicketPage.css';
import { routerInstance } from '../../shared/lib/router/Router';
import { authStore } from '../../shared/store/authStore';

export class TicketPage extends Block {
  protected template = template;

  constructor() {
    super({
      purchaseData: null,
      user: null,
      screenDateFormatted: '',
      screenTimeFormatted: '',
      seatsLabelsString: '',
      ticketsString: ''
    });
  }

  protected async componentDidMount() {
    const td = sessionStorage.getItem('ticketData');
    if (!td) {
      routerInstance.go('/home');
      return;
    }

    const purchaseData = JSON.parse(td);
    const state = authStore.getState();

    const screenDate = new Date(purchaseData.data.screening.start_time);
    
    const seatsLabelsString = purchaseData.seatIds.map((sid: string) => {
      const s = purchaseData.data.seats.find((x: any) => x.id === sid);
      return s ? `${s.row}${s.col}` : '';
    }).filter(Boolean).join(', ');

    const ticketsString = purchaseData.invoice.tickets.map((t: any) => `${t.name} (x${t.qty})`).join(' • ');

    this.setProps({
      purchaseData,
      user: state.user,
      screenDateFormatted: screenDate.toLocaleDateString('es-ES', { day:'2-digit', month:'short', year: 'numeric' }),
      screenTimeFormatted: screenDate.toLocaleTimeString('es-ES', { hour:'2-digit', minute:'2-digit' }),
      seatsLabelsString,
      ticketsString
    });
  }

  protected events = {
    click: (e: Event) => {
      const target = e.target as HTMLElement;

      if (target.id === 'btn-go-home') {
        sessionStorage.removeItem('ticketData');
        routerInstance.go('/home');
      }
    },
    mouseover: (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.id === 'btn-go-home') {
        target.style.backgroundColor = '#374151';
      }
    },
    mouseout: (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.id === 'btn-go-home') {
        target.style.backgroundColor = '#262932';
      }
    }
  };
}
