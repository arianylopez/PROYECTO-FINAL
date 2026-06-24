import Block from '../../shared/lib/block/Block';
import template from './ScreeningSelectionPage.hbs?raw';
import './ScreeningSelectionPage.css';
import { fetchMovieScreenings, fetchMovies, type MovieScreeningsResponse, type Screening } from '../../features/catalog/catalogApi';
import { TicketModal } from '../../widgets/ticket-modal/TicketModal';
import { routerInstance } from '../../shared/lib/router/Router';
import { authStore } from '../../shared/store/authStore';

export class ScreeningSelectionPage extends Block {
  protected template = template;
  private ticketModal: TicketModal;

  constructor() {
    super({
      isLoading: true,
      fetchError: null,
      data: null,
      movie: null,
      upcomingMovies: [],
      
      availableDates: [],
      selectedDate: '',
      formatsList: ['Todos'],
      selectedFormat: 'Todos',
      
      hasRooms: false,
      rooms: [],
      
      durationString: ''
    });

    this.ticketModal = new TicketModal({
      onClose: () => {
        this.ticketModal.getContent()?.remove();
      },
      onContinue: (counts) => {
        this.handleModalContinue(counts);
      }
    });
  }

  protected async componentDidMount() {
    const match = window.location.pathname.match(/\/booking\/([^/]+)\/screenings/);
    let id = '';
    if (match && match[1]) {
      id = match[1];
    } else {
      const matchFallback = window.location.pathname.match(/\/movie\/([^/]+)/);
      if (matchFallback && matchFallback[1]) {
        id = matchFallback[1];
      }
    }

    if (!id) {
      this.setProps({ isLoading: false, fetchError: 'ID de película no proporcionado.' });
      return;
    }

    try {
      const [screeningsResult, upcomingResult] = await Promise.all([
        fetchMovieScreenings(id),
        fetchMovies(1, 12)
      ]);

      const upcoming = upcomingResult.items
        .filter((m: any) => m.id !== id)
        .map((m: any) => ({
          ...m,
          genresString: m.genres.slice(0, 2).join(', '),
          releaseYear: new Date(m.release_date).getFullYear()
        }));

      this.processData(screeningsResult, upcoming);
    } catch (err) {
      console.error("Error cargando el flujo transaccional:", err);
      this.setProps({ isLoading: false, fetchError: 'No se encontraron funciones asociadas o hubo un error.' });
    }
  }

  private processData(data: MovieScreeningsResponse, upcoming: any[]) {
    const groupedByDate: Record<string, Screening[]> = {};
    data.screenings.forEach(sc => {
      const dateObj = new Date(sc.start_time);
      const isToday = new Date().toDateString() === dateObj.toDateString();
      const isTomorrow = new Date(new Date().getTime() + 86400000).toDateString() === dateObj.toDateString();
      
      let dateKey = dateObj.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
      if (isToday) dateKey = `Hoy ${dateObj.getDate()} ${dateObj.toLocaleDateString('es-ES', { month: 'short' })}`.toUpperCase();
      else if (isTomorrow) dateKey = `Mañ. ${dateObj.getDate()} ${dateObj.toLocaleDateString('es-ES', { month: 'short' })}`.toUpperCase();
      else dateKey = dateKey.toUpperCase();

      if (!groupedByDate[dateKey]) groupedByDate[dateKey] = [];
      groupedByDate[dateKey].push(sc);
    });

    const availableDates = Object.keys(groupedByDate);
    const selectedDate = availableDates.length > 0 ? availableDates[0] : '';

    const uniqueFormats = new Set(data.screenings.map(s => s.format));
    const formatsList = ['Todos', ...Array.from(uniqueFormats)];

    const durationMins = data.movie.duration_minutes;
    const durationString = `${Math.floor(durationMins / 60)}h ${durationMins % 60}m`;

    this.setProps({
      isLoading: false,
      data,
      movie: data.movie,
      upcomingMovies: upcoming,
      durationString,
      availableDates,
      selectedDate,
      formatsList,
      selectedFormat: 'Todos'
    });

    this.computeRooms(groupedByDate, selectedDate, 'Todos');
  }

  private computeRooms(groupedByDate: Record<string, Screening[]> | null, date: string, format: string) {
    if (!this.props.data) return;

    const data: MovieScreeningsResponse = this.props.data;
    const grouped: Record<string, Screening[]> = {};
    data.screenings.forEach(sc => {
      const dateObj = new Date(sc.start_time);
      const isToday = new Date().toDateString() === dateObj.toDateString();
      const isTomorrow = new Date(new Date().getTime() + 86400000).toDateString() === dateObj.toDateString();
      let dateKey = dateObj.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
      if (isToday) dateKey = `Hoy ${dateObj.getDate()} ${dateObj.toLocaleDateString('es-ES', { month: 'short' })}`.toUpperCase();
      else if (isTomorrow) dateKey = `Mañ. ${dateObj.getDate()} ${dateObj.toLocaleDateString('es-ES', { month: 'short' })}`.toUpperCase();
      else dateKey = dateKey.toUpperCase();

      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(sc);
    });

    const dayScreenings = grouped[date] || [];
    const filtered = format === 'Todos' ? dayScreenings : dayScreenings.filter(s => s.format === format);
    
    const roomsFiltered: Record<string, any[]> = {};
    filtered.forEach(sc => {
      if (!roomsFiltered[sc.room]) roomsFiltered[sc.room] = [];
      roomsFiltered[sc.room].push({
        ...sc,
        timeString: new Date(sc.start_time).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
      });
    });

    const roomsList = Object.keys(roomsFiltered).map(roomName => ({
      roomName,
      format: roomsFiltered[roomName][0].format,
      language: roomsFiltered[roomName][0].language,
      screenings: roomsFiltered[roomName]
    }));

    this.setProps({
      rooms: roomsList,
      hasRooms: roomsList.length > 0
    });
  }

  private openModal(screeningId: string) {
    const data: MovieScreeningsResponse = this.props.data;
    const sc = data.screenings.find(s => s.id === screeningId);
    if (!sc) return;

    (this as any)._activeScreening = sc;

    const timeStr = new Date(sc.start_time).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    this.ticketModal.open(timeStr, sc.room, data.ticket_types);

    const modalSlot = this.element?.querySelector('#ticket-modal-slot');
    if (modalSlot) {
      modalSlot.innerHTML = '';
      modalSlot.appendChild(this.ticketModal.getContent()!);
    }
  }

  private handleModalContinue(counts: Record<string, number>) {
    this.ticketModal.getContent()?.remove();
    const activeSc = (this as any)._activeScreening;
    if (!activeSc) return;

    const query = new URLSearchParams();
    Object.entries(counts).forEach(([key, val]) => {
      if (val > 0) query.append(key, val.toString()); 
    });

    const targetPath = `/booking/${activeSc.id}/seats?${query.toString()}`;
    
    const { isAuthenticated } = authStore.getState();
    if (!isAuthenticated) {
      routerInstance.go(`/login?redirect=${encodeURIComponent(targetPath)}`);
    } else {
      routerInstance.go(targetPath);
    }
  }

  protected events = {
    click: (e: Event) => {
      const target = e.target as HTMLElement;

      if (target.classList.contains('date-tab')) {
        const date = target.getAttribute('data-date');
        if (date && date !== this.props.selectedDate) {
          this.setProps({ selectedDate: date });
          this.computeRooms(null, date, this.props.selectedFormat);
        }
        return;
      }

      if (target.classList.contains('format-tab')) {
        const format = target.getAttribute('data-format');
        if (format && format !== this.props.selectedFormat) {
          this.setProps({ selectedFormat: format });
          this.computeRooms(null, this.props.selectedDate, format);
        }
        return;
      }

      if (target.id === 'scroll-left-dates') {
        const c = this.element?.querySelector('#dates-container');
        if (c) c.scrollBy({ left: -200, behavior: 'smooth' });
        return;
      }
      if (target.id === 'scroll-right-dates') {
        const c = this.element?.querySelector('#dates-container');
        if (c) c.scrollBy({ left: 200, behavior: 'smooth' });
        return;
      }

      if (target.closest('.upcoming-card')) {
        const nav = target.closest('.upcoming-card')?.getAttribute('data-navigate');
        if (nav) {
          routerInstance.go(nav);
          window.scrollTo(0,0);
        }
        return;
      }

      if (target.classList.contains('screening-time-btn')) {
        const id = target.getAttribute('data-id');
        if (id) {
          this.openModal(id);
        }
        return;
      }
    }
  };
}
