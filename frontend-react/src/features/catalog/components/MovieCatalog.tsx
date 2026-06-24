import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchMovies, fetchGenres, type Movie } from '../catalogApi'; 
import { MovieCard } from './MovieCard';
import { SkeletonCard } from './SkeletonCard';
import { useDebounce } from '../../../shared/hooks/useDebounce';
import '../styles/Catalog.css';

export const MovieCatalog = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const urlSearchQuery = searchParams.get('q') || '';
  const urlGenre = searchParams.get('genre') || 'Todas';

  const [dynamicGenres, setDynamicGenres] = useState<string[]>(['Todas']);

  const [movies, setMovies] = useState<Movie[]>([]);
  const [totalMovies, setTotalMovies] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const debouncedSearchTerm = useDebounce(urlSearchQuery, 350);
  const isFirstMount = useRef(true);

  useEffect(() => {
    const loadDynamicGenres = async () => {
      const dbGenres = await fetchGenres();
      if (dbGenres.length > 0) {
        setDynamicGenres(['Todas', ...dbGenres]);
      }
    };
    loadDynamicGenres();
  }, []);

  const loadMovies = async (
    pageNumber: number, 
    isInitial: boolean = true, 
    searchQ: string = '', 
    genreQ: string = 'Todas'
  ) => {
    if (isInitial) {
      setIsLoading(true);
      setError(null);
    } else {
      setIsFetchingMore(true);
    }

    try {
      const data = await fetchMovies(pageNumber, 12, searchQ, genreQ);
      
      if (isInitial) {
        setMovies(data.items);
      } else {
        setMovies(prev => [...prev, ...data.items]);
      }
      
      setTotalMovies(data.total);
      setHasMore(data.page < data.pages);
    } catch (err: any) {
      console.error("[Internal Log] Fetch error:", err);
      setError("Error al conectar con la cartelera. Por favor intenta de nuevo.");
    } finally {
      setIsLoading(false);
      setIsFetchingMore(false);
    }
  };

  useEffect(() => {
    if (isFirstMount.current) {
        isFirstMount.current = false;
        loadMovies(1, true, debouncedSearchTerm, urlGenre);
        return;
    }

    setPage(1);
    loadMovies(1, true, debouncedSearchTerm, urlGenre);
    
  }, [debouncedSearchTerm, urlGenre]);


  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadMovies(nextPage, false, debouncedSearchTerm, urlGenre);
  };

  const clearFilters = () => {
    setSearchParams(new URLSearchParams(), { replace: true });
  };

  return (
    <section className="catalog-section" id="cartelera">
      
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem', gap: '1rem' }}>
        <div>
          <h2 className="catalog-header__title" style={{ margin: 0 }}>Explorar Cartelera</h2>
          {!isLoading && !error && (
            <p style={{ color: '#9ca3af', margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>
              Mostrando {totalMovies} {totalMovies === 1 ? 'película' : 'películas'}
            </p>
          )}
        </div>

        <div style={{ position: 'relative', minWidth: '220px' }}>
          <select 
            value={urlGenre}
            onChange={(e) => {
              const genre = e.target.value;
              const newParams = new URLSearchParams(searchParams);
              if (genre === 'Todas') {
                newParams.delete('genre');
              } else {
                newParams.set('genre', genre);
              }
              setSearchParams(newParams, { replace: true });
            }}
            style={{
              appearance: 'none',
              width: '100%',
              color: urlGenre === 'Todas' ? '#d1d5db' : '#0f1115',
              border: urlGenre === 'Todas' ? '1px solid #374151' : '1px solid #f4e951',
              backgroundColor: urlGenre === 'Todas' ? '#171a21' : '#f4e951',
              padding: '0.75rem 2.5rem 0.75rem 1.5rem',
              borderRadius: '30px',
              fontSize: '0.95rem',
              fontWeight: '800',
              cursor: 'pointer',
              outline: 'none',
              boxShadow: '0 10px 20px rgba(0,0,0,0.3)',
              transition: 'all 0.2s ease',
              textTransform: 'uppercase'
            }}
          >
            {dynamicGenres.map(genre => (
              <option key={genre} value={genre} style={{ color: '#fff', backgroundColor: '#171a21', textTransform: 'initial' }}>
                {genre === 'Todas' ? 'Todos los Géneros' : genre}
              </option>
            ))}
          </select>
          
          <svg 
            style={{ position: 'absolute', right: '18px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: urlGenre === 'Todas' ? '#9ca3af' : '#0f1115' }} 
            width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
      </div>

      {urlSearchQuery && (
        <div style={{ marginBottom: '2rem', padding: '1rem 1.5rem', backgroundColor: 'rgba(244, 233, 81, 0.05)', border: '1px dashed rgba(244, 233, 81, 0.4)', borderRadius: '8px', color: '#e5e7eb' }}>
          Resultados para la búsqueda: <strong style={{ color: '#f4e951', fontSize: '1.1rem', marginLeft: '0.5rem' }}>"{urlSearchQuery}"</strong>
        </div>
      )}

      {error && movies.length === 0 ? (
        <div className="catalog-state">
          <div className="catalog-state__icon">🔌</div>
          <h2 className="catalog-state__title">{error}</h2>
          <button className="catalog-state__btn" onClick={() => loadMovies(1, true, debouncedSearchTerm, urlGenre)}>Reintentar</button>
        </div>
      ) : 
      !isLoading && movies.length === 0 ? (
        <div className="catalog-state" style={{ padding: '5rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div className="catalog-state__icon" style={{ fontSize: '4rem', opacity: 0.5, marginBottom: '1rem' }}>🔍</div>
          <h2 className="catalog-state__title" style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>No encontramos películas para tu búsqueda.</h2>
          <p style={{ color: '#9ca3af', margin: '0 0 2rem 0' }}>Intenta probar con otros términos o limpia los filtros activos.</p>
          <button className="catalog-state__btn" onClick={clearFilters} style={{ padding: '0.8rem 2rem', backgroundColor: '#f4e951', color: '#000', borderRadius: '30px', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>Ver toda la cartelera</button>
        </div>
      ) : (
        <>
          <div className="catalog-grid">
            {movies.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}

            {(isLoading || isFetchingMore) && 
              Array.from({ length: isLoading ? 8 : 4 }).map((_, i) => (
                <SkeletonCard key={`skeleton-${i}`} />
              ))
            }
          </div>

          {hasMore && !isLoading && (
            <div className="catalog-footer" style={{ marginTop: '4rem', textAlign: 'center' }}>
              <button 
                className="catalog-footer__btn" 
                onClick={handleLoadMore} 
                disabled={isFetchingMore}
                style={{ backgroundColor: '#171a21', border: '1px solid #374151', color: '#fff', padding: '1rem 3rem', borderRadius: '30px', fontWeight: 'bold', cursor: isFetchingMore ? 'not-allowed' : 'pointer' }}
              >
                {isFetchingMore ? 'Cargando...' : 'Ver Más Películas'}
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
};