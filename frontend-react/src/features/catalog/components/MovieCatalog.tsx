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
  const initialGenre = searchParams.get('genre') || 'Todas';

  const [selectedGenre, setSelectedGenre] = useState(initialGenre);
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
        loadMovies(1, true, debouncedSearchTerm, selectedGenre);
        return;
    }

    const newParams = new URLSearchParams();
    if (debouncedSearchTerm) newParams.set('q', debouncedSearchTerm);
    if (selectedGenre !== 'Todas') newParams.set('genre', selectedGenre);
    setSearchParams(newParams, { replace: true });

    setPage(1);
    loadMovies(1, true, debouncedSearchTerm, selectedGenre);
    
  }, [debouncedSearchTerm, selectedGenre]);


  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadMovies(nextPage, false, debouncedSearchTerm, selectedGenre);
  };

  const clearFilters = () => {
    setSelectedGenre('Todas');
    setSearchParams(new URLSearchParams(), { replace: true });
  };

  return (
    <section className="catalog-section" id="cartelera">
      
      <div className="catalog-header">
        <div>
          <h2 className="catalog-header__title">Explorar Cartelera</h2>
          {!isLoading && !error && (
            <p style={{ color: '#9ca3af', margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>
              Mostrando {totalMovies} {totalMovies === 1 ? 'película' : 'películas'}
            </p>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-end' }}>
          
          <div className="catalog-filters">
            {dynamicGenres.map(genre => (
              <button 
                key={genre}
                className={`catalog-filters__tab ${selectedGenre === genre ? 'active' : ''}`}
                onClick={() => setSelectedGenre(genre)}
              >
                {genre}
              </button>
            ))}
          </div>

        </div>
      </div>

      {urlSearchQuery && (
        <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: 'rgba(244, 233, 81, 0.05)', border: '1px solid rgba(244, 233, 81, 0.2)', borderRadius: '8px', color: '#e5e7eb' }}>
          Resultados para la búsqueda: <strong style={{ color: '#f4e951', fontSize: '1.1rem' }}>"{urlSearchQuery}"</strong>
        </div>
      )}

      {error && movies.length === 0 ? (
        <div className="catalog-state">
          <div className="catalog-state__icon">🔌</div>
          <h2 className="catalog-state__title">{error}</h2>
          <button className="catalog-state__btn" onClick={() => loadMovies(1, true, debouncedSearchTerm, selectedGenre)}>Reintentar</button>
        </div>
      ) : 
      !isLoading && movies.length === 0 ? (
        <div className="catalog-state">
          <div className="catalog-state__icon">🔍</div>
          <h2 className="catalog-state__title">No encontramos películas para tu búsqueda.</h2>
          <p style={{ color: '#6b7280', margin: '0.5rem 0 1.5rem 0' }}>Intenta probar con otros términos o limpia los filtros activos.</p>
          <button className="catalog-state__btn" onClick={clearFilters}>Ver toda la cartelera</button>
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
            <div className="catalog-footer">
              <button 
                className="catalog-footer__btn" 
                onClick={handleLoadMore} 
                disabled={isFetchingMore}
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