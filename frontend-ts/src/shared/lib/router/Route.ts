import Block from '../block/Block';
import { renderDOM } from '../block/renderDOM';
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

  getProps() {
    return this._props;
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
    if (this._pathname.includes(':')) {
      const regexPattern = this._pathname.replace(/:[^/]+/g, '([^/]+)');
      const regex = new RegExp(`^${regexPattern}$`);
      return regex.test(pathname);
    }
    return pathname === this._pathname;
  }

  async render() {
    if (!this._block) {
      let BlockClass = this._blockClass;
      if (this._props.isDynamic) {
        BlockClass = await this._blockClass();
      }
      this._block = new BlockClass(this._props);
      renderDOM(this._props.rootQuery, this._block!);
      return;
    }
    this._block.show();
    if (typeof (this._block as any).updateUrlParams === 'function') {
      (this._block as any).updateUrlParams();
    }
  }
}