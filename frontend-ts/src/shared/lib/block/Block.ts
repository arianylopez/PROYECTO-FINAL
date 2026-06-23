import Handlebars from 'handlebars';
import { EventBus } from './EventBus';

export const EVENTS = {
  INIT: 'init',
  FLOW_CDM: 'flow:component-did-mount',
  FLOW_CDU: 'flow:component-did-update',
  FLOW_RENDER: 'flow:render',
} as const;

export default abstract class Block<Props extends Record<string, any> = any> {
  protected props: Props;
  protected children: Record<string, Block>;
  private eventBus: () => EventBus;
  private _element: HTMLElement | null = null;
  private _id: string = Math.random().toString(36).substring(2, 9);

  protected abstract template: string;
  protected events: Record<string, EventListener> = {};

  constructor(propsWithChildren: any = {}) {
    const eventBus = new EventBus();
    const { props, children } = this._getChildrenAndProps(propsWithChildren);

    this.children = children;
    this.props = this._makePropsProxy(props);
    this.eventBus = () => eventBus;

    this._registerEvents(eventBus);
  }

  private _getChildrenAndProps(childrenAndProps: any) {
    const props: Record<string, any> = {};
    const children: Record<string, Block> = {};

    Object.entries(childrenAndProps).forEach(([key, value]) => {
      if (value instanceof Block) {
        children[key] = value;
      } else {
        props[key] = value;
      }
    });

    return { props, children };
  }

  private _registerEvents(eventBus: EventBus) {
    eventBus.on(EVENTS.INIT, this._init.bind(this));
    eventBus.on(EVENTS.FLOW_CDM, this._componentDidMount.bind(this));
    eventBus.on(EVENTS.FLOW_CDU, this._componentDidUpdate.bind(this));
    eventBus.on(EVENTS.FLOW_RENDER, this._render.bind(this));
  }

  private _init() {
    this.init();
    this.eventBus().emit(EVENTS.FLOW_RENDER);
  }

  protected init() {}

  private _componentDidMount() {
    this.componentDidMount();
  }

  protected componentDidMount() {}

  public dispatchComponentDidMount() {
    this.eventBus().emit(EVENTS.FLOW_CDM);
    Object.values(this.children).forEach((child) => child.dispatchComponentDidMount());
  }

  private _componentDidUpdate(oldProps: Props, newProps: Props) {
    const response = this.componentDidUpdate(oldProps, newProps);
    if (response) {
      this.eventBus().emit(EVENTS.FLOW_RENDER);
    }
  }

  protected componentDidUpdate(oldProps: Props, newProps: Props): boolean {
    return true;
  }

  public setProps = (nextProps: Partial<Props>) => {
    if (!nextProps) return;
    Object.assign(this.props, nextProps);
  };

  get element() {
    return this._element;
  }

  private _render() {
    const templateString = this.template;
    const compiledTemplate = Handlebars.compile(templateString);
    
    const contextAndStubs = { ...this.props };
    
    const fragment = document.createElement('template');
    fragment.innerHTML = compiledTemplate(contextAndStubs);

    const newElement = fragment.content.firstElementChild as HTMLElement;

    const classEvents = (this as any).events || {};
    Object.keys(classEvents).forEach((eventName) => {
      newElement.addEventListener(eventName, classEvents[eventName]);
    });

    if (this.props.events) {
      Object.keys(this.props.events).forEach((eventName) => {
        newElement.addEventListener(eventName, this.props.events[eventName]);
      });
    }

    if (this._element && newElement) {
      this._element.replaceWith(newElement);
    }

    this._element = newElement;
  }

  public getContent() {
    if (!this._element) {
      this.eventBus().emit(EVENTS.INIT);
    }
    return this.element;
  }

  private _makePropsProxy(props: any) {
    const self = this;
    return new Proxy(props, {
      get(target, prop: string) {
        const value = target[prop];
        return typeof value === 'function' ? value.bind(target) : value;
      },
      set(target, prop: string, value) {
        const oldTarget = { ...target };
        target[prop] = value;
        self.eventBus().emit(EVENTS.FLOW_CDU, oldTarget, target);
        return true;
      },
      deleteProperty() {
        throw new Error('Not allowed');
      },
    });
  }
}