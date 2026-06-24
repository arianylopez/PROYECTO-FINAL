import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchGenres } from '../features/catalog/catalogApi';
import { useAuthStore } from '../shared/store/authStore';
import { apiClient } from '../shared/api/apiClient';
import './OnboardingPreferences.css';

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
    fetchGenres()
      .then(setGenres)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [user, navigate]);

  const toggleGenre = (genre: string) => {
    setErrorMsg('');
    if (selected.includes(genre)) {
      setSelected((prev) => prev.filter((g) => g !== genre));
    } else {
      if (selected.length >= 5) {
        setErrorMsg('Podés seleccionar hasta 5 géneros');
        return;
      }
      setSelected((prev) => [...prev, genre]);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    try {
      await apiClient.put(`/auth/users/${user.id}/preferences`, { genres: selected });
      navigate('/home');
    } catch (error: any) {
      const backendError = error.response?.data?.detail?.[0]?.msg || 'Error al guardar preferencias';
      setErrorMsg(backendError.replace('Value error, ', ''));
    }
  };

  const handleSkip = () => {
    navigate('/home');
  };

  if (isLoading) return <div className="onboarding__loading">Cargando géneros...</div>;

  return (
    <div className="onboarding">
      <div className="onboarding__card">
        <h1 className="onboarding__title">¿Qué géneros te gustan?</h1>
        <p className="onboarding__subtitle">Elige hasta 5 géneros para personalizar tu cartelera.</p>

        {errorMsg && <div className="onboarding__alert">{errorMsg}</div>}

        <div className="onboarding__genres">
          {genres.map((genre) => {
            const isSelected = selected.includes(genre);
            return (
              <button
                key={genre}
                onClick={() => toggleGenre(genre)}
                className={`onboarding__genre-btn ${isSelected ? 'onboarding__genre-btn--selected' : ''}`}
              >
                {genre}
              </button>
            );
          })}
        </div>

        <div className="onboarding__actions">
          <button onClick={handleSave} disabled={selected.length === 0} className="onboarding__btn-save">
            Guardar y Continuar
          </button>

          <button onClick={handleSkip} className="onboarding__btn-skip">
            Saltar por ahora
          </button>
        </div>
      </div>
    </div>
  );
};
