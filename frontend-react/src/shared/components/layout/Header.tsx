import { useNavigate } from 'react-router-dom';

export const Header = () => {
  const navigate = useNavigate();

  return (
    <header style={{ 
      backgroundColor: 'rgba(15, 17, 21, 0.95)', backdropFilter: 'blur(12px)', 
      padding: '1.2rem 6%', display: 'flex', justifyContent: 'space-between', 
      alignItems: 'center', borderBottom: '1px solid #262932', 
      position: 'sticky', top: 0, zIndex: 100 
    }}>
      <h1 
        style={{ color: '#f4e951', margin: 0, fontSize: '1.8rem', fontWeight: '900', letterSpacing: '0.5px', cursor: 'pointer' }} 
        onClick={() => navigate('/home')}
      >
        CINEMAPLUS
      </h1>
      <nav style={{ display: 'flex', gap: '2rem' }}>
        <button onClick={() => navigate('/home')} style={{ background: 'none', border: 'none', color: '#e5e7eb', fontWeight: '600', cursor: 'pointer', fontSize: '1rem' }}>Cartelera</button>
        <button onClick={() => alert('Próximamente')} style={{ background: 'none', border: 'none', color: '#9ca3af', fontWeight: '600', cursor: 'pointer', fontSize: '1rem' }}>Cines</button>
      </nav>
    </header>
  );
};