import Block from '../../shared/lib/block/Block';
import template from './OrdersHistoryPage.hbs?raw';
import { routerInstance } from '../../shared/lib/router/Router';
import { authStore } from '../../shared/store/authStore';
import { 
  fetchMyOrders, 
  fetchWatchlist, 
  toggleWatchlist, 
  fetchActivityHistory, 
  type OrderHistoryItem, 
  type WatchlistItem, 
  type ActivityItem 
} from '../../features/catalog/catalogApi';

export class OrdersHistoryPage extends Block {
  protected template = template;

  constructor() {
    super({
      isLoading: true,
      activeTab: 'tickets',
      user: null,
      userInitial: 'U',
      
      orders: [],
      upcomingOrders: [],
      pastOrders: [],
      selectedOrder: null,
      
      watchlist: [],
      activities: []
    });
  }

  protected async componentDidMount() {
    const searchParams = new URLSearchParams(window.location.search);
    const tab = searchParams.get('tab') || 'tickets';
    this.setProps({ activeTab: tab });

    const state = authStore.getState();
    if (!state.user) {
      routerInstance.go('/login?redirect=/me/orders');
      return;
    }

    this.setProps({ 
      user: state.user,
      userInitial: state.user.name ? state.user.name.charAt(0).toUpperCase() : 'U'
    });

    await this.loadData(tab);

    authStore.on('changed', () => {
      const s = authStore.getState();
      if (!s.user) {
        routerInstance.go('/login?redirect=/me/orders');
      } else {
        this.setProps({ 
          user: s.user,
          userInitial: s.user.name ? s.user.name.charAt(0).toUpperCase() : 'U'
        });
      }
    });
  }

  private async loadData(tab: string) {
    this.setProps({ isLoading: true });
    try {
      const userId = this.props.user?.id;
      if (!userId) return;

      if (tab === 'tickets') {
        const data = await fetchMyOrders(userId);
        this.processOrders(data);
      } else if (tab === 'list') {
        const data = await fetchWatchlist(userId);
        this.setProps({ watchlist: data });
      } else if (tab === 'activity') {
        const data = await fetchActivityHistory(userId);
        this.processActivities(data);
      }
    } catch (error) {
      console.error(`Error cargando pestaña ${tab}:`, error);
    } finally {
      this.setProps({ isLoading: false });
    }
  }

  private processOrders(orders: OrderHistoryItem[]) {
    const now = new Date();
    const upcoming: any[] = [];
    const past: any[] = [];
    
    orders.forEach(order => {
      const screenTime = new Date(order.start_time);
      const isSelected = this.props.selectedOrder?.id === order.id;

      const formattedOrder = {
        ...order,
        selected: isSelected,
        seatLabelsStr: order.seat_labels.join(', '),
        formattedDate: screenTime > now 
          ? screenTime.toLocaleString('es-ES', { weekday:'short', day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })
          : screenTime.toLocaleDateString('es-ES', { day:'numeric', month:'long', year:'numeric' })
      };

      if (screenTime > now) upcoming.push(formattedOrder);
      else past.push(formattedOrder);
    });

    let selectedOrderDetails = null;
    if (this.props.selectedOrder) {
      const sd = new Date(this.props.selectedOrder.start_time);
      selectedOrderDetails = {
        ...this.props.selectedOrder,
        detailsDate: sd.toLocaleDateString('es-ES'),
        detailsTime: sd.toLocaleTimeString('es-ES', {hour:'2-digit', minute:'2-digit'}),
        seatLabelsStr: this.props.selectedOrder.seat_labels.join(', ')
      };
    }

    this.setProps({ orders, upcomingOrders: upcoming, pastOrders: past, selectedOrder: selectedOrderDetails });
  }

  private processActivities(activities: ActivityItem[]) {
    const getIconColor = (type: string) => {
      switch(type) {
        case 'rating': return '#f4e951';
        case 'review': return '#60a5fa';
        case 'purchase': return '#4ade80';
        case 'watchlist': return '#f87171';
        default: return '#9ca3af';
      }
    };

    const formatted = activities.map(act => ({
      ...act,
      iconColor: getIconColor(act.type),
      formattedDate: new Date(act.date).toLocaleString('es-ES')
    }));

    this.setProps({ activities: formatted });
  }

  private async handleRemoveFromWatchlist(movieId: string) {
    if (!this.props.user) return;
    try {
      await toggleWatchlist(movieId, this.props.user.id, "", "");
      const newWatchlist = this.props.watchlist.filter((i: WatchlistItem) => i.movie_id !== movieId);
      this.setProps({ watchlist: newWatchlist });
    } catch (err) {
      alert("Error al remover de la lista.");
    }
  }

  protected events = {
    click: (e: Event) => {
      const target = e.target as HTMLElement;

      if (target.id === 'tab-tickets') {
        this.setProps({ activeTab: 'tickets', selectedOrder: null });
        window.history.pushState({}, '', '?tab=tickets');
        this.loadData('tickets');
        return;
      }
      if (target.id === 'tab-list') {
        this.setProps({ activeTab: 'list', selectedOrder: null });
        window.history.pushState({}, '', '?tab=list');
        this.loadData('list');
        return;
      }
      if (target.id === 'tab-activity') {
        this.setProps({ activeTab: 'activity', selectedOrder: null });
        window.history.pushState({}, '', '?tab=activity');
        this.loadData('activity');
        return;
      }

      if (target.id === 'btn-explore') {
        routerInstance.go('/home');
        return;
      }

      if (target.id === 'btn-close-order') {
        this.setProps({ selectedOrder: null });
        this.processOrders(this.props.orders);
        return;
      }

      const removeBtn = target.closest('.btn-remove-watchlist');
      if (removeBtn) {
        e.stopPropagation();
        const id = removeBtn.getAttribute('data-id');
        if (id) this.handleRemoveFromWatchlist(id);
        return;
      }

      const watchlistItem = target.closest('.watchlist-item');
      if (watchlistItem) {
        const id = watchlistItem.getAttribute('data-id');
        if (id) routerInstance.go(`/movie/${id}`);
        return;
      }

      const orderItem = target.closest('.order-item');
      if (orderItem) {
        const id = orderItem.getAttribute('data-id');
        if (id) {
          const order = this.props.orders.find((o: OrderHistoryItem) => o.id === id);
          if (order) {
            this.setProps({ selectedOrder: order });
            this.processOrders(this.props.orders);
          }
        }
        return;
      }
    },
    mouseover: (e: Event) => {
        const target = e.target as HTMLElement;
        const watchlistItem = target.closest('.watchlist-item') as HTMLElement;
        if (watchlistItem) {
            watchlistItem.style.transform = 'scale(1.03)';
        }
    },
    mouseout: (e: Event) => {
        const target = e.target as HTMLElement;
        const watchlistItem = target.closest('.watchlist-item') as HTMLElement;
        if (watchlistItem) {
            watchlistItem.style.transform = 'scale(1)';
        }
    }
  };
}
