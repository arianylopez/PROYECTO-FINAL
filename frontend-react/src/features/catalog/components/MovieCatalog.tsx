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
        setMovies((prev) => [...prev, ...data.items]);
      }

      setTotalMovies(data.total);
      setHasMore(data.page < data.pages);
    } catch (err: any) {
      console.error('[Internal Log] Fetch error:', err);
      setError('Error al conectar con la cartelera. Por favor intenta de nuevo.');
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
      <div className="catalog-header">
        <div className="catalog-header__info">
          <h2 className="catalog-header__title">Explorar Cartelera</h2>
          {!isLoading && !error && (
            <p className="catalog-header__subtitle">
              Mostrando {totalMovies} {totalMovies === 1 ? 'película' : 'películas'}
            </p>
          )}
        </div>

        <div className="catalog-filters">
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
            className={`catalog-filters__select ${urlGenre !== 'Todas' ? 'catalog-filters__select--active' : ''}`}
          >
            {dynamicGenres.map((genre) => (
              <option key={genre} value={genre} className="catalog-filters__option">
                {genre === 'Todas' ? 'Todos los Géneros' : genre}
              </option>
            ))}
          </select>

          <svg
            className="catalog-filters__icon"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
      </div>

      {urlSearchQuery && (
        <div className="catalog-search-results">
          Resultados para la búsqueda: <strong className="catalog-search-results__query">"{urlSearchQuery}"</strong>
        </div>
      )}

      {error && movies.length === 0 ? (
        <div className="catalog-state">
          <div className="catalog-state__icon">🔌</div>
          <h2 className="catalog-state__title">{error}</h2>
          <button className="catalog-state__btn" onClick={() => loadMovies(1, true, debouncedSearchTerm, urlGenre)}>
            Reintentar
          </button>
        </div>
      ) : !isLoading && movies.length === 0 ? (
        <div className="catalog-state catalog-state--empty">
          <div className="catalog-state__icon catalog-state__icon--empty">🔍</div>
          <h2 className="catalog-state__title catalog-state__title--empty">
            No encontramos películas para tu búsqueda.
          </h2>
          <p className="catalog-state__subtitle">Intenta probar con otros términos o limpia los filtros activos.</p>
          <button className="catalog-state__btn catalog-state__btn--primary" onClick={clearFilters}>
            Ver toda la cartelera
          </button>
        </div>
      ) : (
        <>
          <div className="catalog-grid">
            {movies.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}

            {(isLoading || isFetchingMore) &&
              Array.from({ length: isLoading ? 8 : 4 }).map((_, i) => <SkeletonCard key={`skeleton-${i}`} />)}
          </div>

          {hasMore && !isLoading && (
            <div className="catalog-footer">
              <button className="catalog-footer__btn" onClick={handleLoadMore} disabled={isFetchingMore}>
                {isFetchingMore ? 'Cargando...' : 'Ver Más Películas'}
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
};
