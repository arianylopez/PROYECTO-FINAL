import './Footer.css';

export const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer__container">
        <div>
          <h2 className="footer__brand-title">CINEMAPLUS</h2>
          <p className="footer__brand-desc">Tu destino definitivo para la mejor experiencia cinematográfica. Vive la magia del cine con la mejor tecnología.</p>
        </div>
        <div>
          <h3 className="footer__links-title">Explorar</h3>
          <ul className="footer__links-list">
            <li><a href="/home" className="footer__link">Cartelera</a></li>
            <li><a href="/home" className="footer__link">Próximos Estrenos</a></li>
          </ul>
        </div>
      </div>
      <div className="footer__bottom">
        <p>© {new Date().getFullYear()} CinemaPlus. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
};