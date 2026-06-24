import Block from '../../lib/block/Block';
import { Header } from '../../../widgets/header/Header';
import { Footer } from '../../../widgets/footer/Footer';
import './MainLayout.css';

export class MainLayout extends Block {
  protected template = `
    <div class="main-layout">
      <div id="header-slot"></div>
      <main id="content-slot" class="main-layout__content"></main>
      <div id="footer-slot"></div>
    </div>
  `;

  private contentBlock: Block;

  constructor(contentBlock: Block) {
    super();
    this.contentBlock = contentBlock;
  }

  protected componentDidMount() {
    const headerSlot = this.element?.querySelector('#header-slot');
    const footerSlot = this.element?.querySelector('#footer-slot');
    const contentSlot = this.element?.querySelector('#content-slot');

    if (headerSlot) {
      const header = new Header();
      headerSlot.replaceWith(header.getContent()!);
      header.dispatchComponentDidMount();
    }

    if (footerSlot) {
      const footer = new Footer();
      footerSlot.replaceWith(footer.getContent()!);
      footer.dispatchComponentDidMount();
    }

    if (contentSlot) {
      const contentEl = this.contentBlock.getContent();
      if (contentEl) {
        contentSlot.appendChild(contentEl);
        this.contentBlock.dispatchComponentDidMount();
      }
    }
  }

  public updateUrlParams() {
    if (typeof (this.contentBlock as any).updateUrlParams === 'function') {
      (this.contentBlock as any).updateUrlParams();
    }
  }
}

export function withMainLayout(PageClass: new () => Block): new () => Block {
  return class extends MainLayout {
    constructor() {
      super(new PageClass());
    }
  };
}
