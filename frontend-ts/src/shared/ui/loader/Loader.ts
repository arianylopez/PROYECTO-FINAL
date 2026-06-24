import Block from '../../lib/block/Block';
import './Loader.css';

export class Loader extends Block {
  protected template = `
    <div class="loader">
      <span class="loader__text">CARGANDO...</span>
    </div>
  `;
}
