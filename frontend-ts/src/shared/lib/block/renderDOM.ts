import Block from './Block';

export function renderDOM(query: string, block: Block) {
  const root = document.querySelector(query);

  if (!root) {
    throw new Error(`Root not found: ${query}`);
  }

  root.innerHTML = '';
  root.appendChild(block.getContent()!);
  block.dispatchComponentDidMount();

  return root;
}