export const Footer = () => {
  return (
    <footer style={{ backgroundColor: '#0a0c0f', borderTop: '1px solid #262932', padding: '4rem 6% 2rem', color: '#9ca3af', marginTop: 'auto' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '3rem', marginBottom: '3rem' }}>
        <div>
          <h2 style={{ color: '#f4e951', fontSize: '1.5rem', fontWeight: '900', marginBottom: '1rem' }}>CINEMAPLUS</h2>
          <p style={{ lineHeight: '1.6', fontSize: '0.95rem' }}>Tu destino definitivo para la mejor experiencia cinematográfica. Vive la magia del cine con la mejor tecnología.</p>
        </div>
        <div>
          <h3 style={{ color: '#ffffff', marginBottom: '1.2rem', fontSize: '1.1rem' }}>Explorar</h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            <li><a href="#" style={{ color: '#9ca3af', textDecoration: 'none', transition: 'color 0.2s' }}>Cartelera</a></li>
            <li><a href="#" style={{ color: '#9ca3af', textDecoration: 'none' }}>Próximos Estrenos</a></li>
          </ul>
        </div>
      </div>
      <div style={{ textAlign: 'center', borderTop: '1px solid #1f222b', paddingTop: '2rem', fontSize: '0.85rem' }}>
        <p>© {new Date().getFullYear()} CinemaPlus. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
};