import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchGenres } from '../features/catalog/catalogApi';
import { useAuthStore } from '../shared/store/authStore';
import { apiClient } from '../shared/api/apiClient';

export const OnboardingPreferencesPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [genres, setGenres] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchGenres().then(setGenres).catch(console.error).finally(() => setIsLoading(false));
  }, [user, navigate]);

  const toggleGenre = (genre: string) => {
    setErrorMsg('');
    if (selected.includes(genre)) {
      setSelected(prev => prev.filter(g => g !== genre));
    } else {
      if (selected.length >= 5) {
        setErrorMsg("Podés seleccionar hasta 5 géneros");
        return;
      }
      setSelected(prev => [...prev, genre]);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    try {
      await apiClient.put(`/auth/users/${user.id}/preferences`, { genres: selected });
      navigate('/home');
    } catch (error: any) {
      const backendError = error.response?.data?.detail?.[0]?.msg || "Error al guardar preferencias";
      setErrorMsg(backendError.replace('Value error, ', '')); 
    }
  };

  const handleSkip = () => {
    navigate('/home');
  };

  if (isLoading) return <div style={{ minHeight: '100vh', backgroundColor: '#0f1115', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#f4e951' }}>Cargando géneros...</div>;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0f1115', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem', fontFamily: '"Inter", system-ui, sans-serif' }}>
      <div style={{ backgroundColor: '#171a21', padding: '3rem', borderRadius: '24px', border: '1px solid #262932', maxWidth: '600px', width: '100%', textAlign: 'center', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
        
        <h1 style={{ color: '#fff', fontSize: '2rem', fontWeight: '900', marginBottom: '0.5rem' }}>¿Qué géneros te gustan?</h1>
        <p style={{ color: '#9ca3af', marginBottom: '2rem' }}>Elige hasta 5 géneros para personalizar tu cartelera.</p>

        {errorMsg && (
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.3)', fontWeight: 'bold', marginBottom: '1.5rem' }}>
            {errorMsg}
          </div>
        )}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center', marginBottom: '3rem' }}>
          {genres.map(genre => {
            const isSelected = selected.includes(genre);
            return (
              <button
                key={genre}
                onClick={() => toggleGenre(genre)}
                style={{
                  backgroundColor: isSelected ? '#f4e951' : 'transparent',
                  color: isSelected ? '#000' : '#d1d5db',
                  border: isSelected ? '1px solid #f4e951' : '1px solid #374151',
                  padding: '0.8rem 1.5rem',
                  borderRadius: '30px',
                  fontWeight: '700',
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  transform: isSelected ? 'scale(1.05)' : 'scale(1)'
                }}
              >
                {genre}
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <button 
            onClick={handleSave}
            disabled={selected.length === 0}
            style={{ backgroundColor: selected.length > 0 ? '#f4e951' : '#374151', color: selected.length > 0 ? '#000' : '#9ca3af', border: 'none', padding: '1.2rem', borderRadius: '30px', fontWeight: '900', textTransform: 'uppercase', cursor: selected.length > 0 ? 'pointer' : 'not-allowed', transition: 'all 0.2s' }}
          >
            Guardar y Continuar
          </button>
          
          <button 
            onClick={handleSkip}
            style={{ backgroundColor: 'transparent', color: '#9ca3af', border: 'none', fontWeight: '600', cursor: 'pointer', padding: '0.5rem' }}
          >
            Saltar por ahora
          </button>
        </div>

      </div>
    </div>
  );
};