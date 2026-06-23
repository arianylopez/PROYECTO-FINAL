import Block from '../block/Block.ts';

export class Route {
  private _pathname: string;
  private _blockClass: any;
  private _block: Block | null;
  private _props: Record<string, any>;

  constructor(pathname: string, viewClass: any, props: Record<string, any>) {
    this._pathname = pathname;
    this._blockClass = viewClass;
    this._block = null;
    this._props = props;
  }

  navigate(pathname: string) {
    if (this.match(pathname)) {
      this._pathname = pathname;
      this.render();
    }
  }

  leave() {
    if (this._block) {
      const element = this._block.getContent();
      if (element) {
        element.remove();
      }
      this._block = null;
    }
  }

  match(pathname: string) {
    return pathname === this._pathname;
  }

  render() {
    if (!this._block) {
      this._block = new this._blockClass();
    }
    const rootQuery: string = this._props.rootQuery;
    const root = document.querySelector(rootQuery);
    if (!root) {
      throw new Error(`Root element not found by selector: ${rootQuery}`);
    }

    const content = this._block!.getContent();
    if (!content) return;

    root.innerHTML = '';
    root.appendChild(content);
  }
}