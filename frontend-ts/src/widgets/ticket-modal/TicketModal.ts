import Block from '../../shared/lib/block/Block';
import template from './TicketModal.hbs?raw';
import './TicketModal.css';


export interface TicketType {
  id: string;
  name: string;
  price: number;
}

interface TicketModalProps {
  isOpen: boolean;
  ticketTypes: TicketType[];
  screeningTime: string;
  screeningRoom: string;
  ticketCounts: Record<string, number>;
  totalTickets: number;
  totalPrice: number;
  onClose?: () => void;
  onContinue?: (counts: Record<string, number>) => void;
}

export class TicketModal extends Block<TicketModalProps> {
  protected template = template;

  constructor(props: Partial<TicketModalProps> = {}) {
    super({
      isOpen: false,
      ticketTypes: [],
      screeningTime: '',
      screeningRoom: '',
      ticketCounts: {},
      totalTickets: 0,
      totalPrice: 0,
      ...props
    });
  }

  public open(time: string, room: string, types: TicketType[]) {
    const counts: Record<string, number> = {};
    types.forEach(t => counts[t.id] = 0);

    this.setProps({
      isOpen: true,
      screeningTime: time,
      screeningRoom: room,
      ticketTypes: types,
      ticketCounts: counts,
      totalTickets: 0,
      totalPrice: 0
    });
  }

  public close() {
    this.setProps({ isOpen: false });
    if (this.props.onClose) {
      this.props.onClose();
    }
  }

  private updateTotals(counts: Record<string, number>) {
    let t = 0;
    let p = 0;
    this.props.ticketTypes.forEach((type: TicketType) => {
      const q = counts[type.id] || 0;
      t += q;
      p += q * type.price;
    });
    this.setProps({ ticketCounts: counts, totalTickets: t, totalPrice: p });
  }

  protected events = {
    click: (e: Event) => {
      const target = e.target as HTMLElement;

      if (target.id === 'cancel-modal') {
        this.close();
        return;
      }

      if (target.id === 'continue-modal') {
        if (this.props.totalTickets > 0 && this.props.onContinue) {
          this.props.onContinue(this.props.ticketCounts);
        }
        return;
      }

      if (target.classList.contains('increment')) {
        const id = target.getAttribute('data-id');
        if (id) {
          const newCounts = { ...this.props.ticketCounts };
          newCounts[id] = (newCounts[id] || 0) + 1;
          this.updateTotals(newCounts);
        }
        return;
      }

      if (target.classList.contains('decrement')) {
        const id = target.getAttribute('data-id');
        if (id) {
          const newCounts = { ...this.props.ticketCounts };
          newCounts[id] = Math.max(0, (newCounts[id] || 0) - 1);
          this.updateTotals(newCounts);
        }
        return;
      }
    }
  };
}
