import { CinemaDocument } from '../engine/types';
import { parseScreenplay } from '../engine/parser/screenplayParser';
import { SAMPLE_SCRIPTS } from '../engine/samples/sampleScripts';

const STORAGE_KEY = 'abscinema_films_v1';
const ACTIVE_FILM_KEY = 'abscinema_active_film_id';

export function getStoredFilms(): CinemaDocument[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Initialize with built-in samples on first run
      const initialFilms: CinemaDocument[] = SAMPLE_SCRIPTS.map((s, idx) => 
        parseScreenplay(s.script, {
          id: s.id || `film-sample-${idx}-${Date.now()}`,
          title: s.title,
          author: s.author,
          directorStyle: s.directorStyle,
        })
      );
      saveAllFilms(initialFilms);
      return initialFilms;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // De-duplicate any films that share the same ID to prevent React duplicate key errors
      const seenIds = new Set<string>();
      const deduped: CinemaDocument[] = [];
      let fixedAny = false;

      for (let i = 0; i < parsed.length; i++) {
        const film = parsed[i];
        if (!film.id || seenIds.has(film.id)) {
          film.id = `film-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 7)}`;
          fixedAny = true;
        }
        seenIds.add(film.id);
        deduped.push(film);
      }

      if (fixedAny) {
        saveAllFilms(deduped);
      }
      return deduped;
    }
    return [];
  } catch (e) {
    console.error('Failed to load films from localStorage', e);
    return [];
  }
}

export function saveAllFilms(films: CinemaDocument[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(films));
  } catch (e) {
    console.error('Failed to save films', e);
  }
}

export function saveFilm(film: CinemaDocument): void {
  const films = getStoredFilms();
  const index = films.findIndex(f => f.id === film.id);
  film.updatedAt = Date.now();
  if (index >= 0) {
    films[index] = film;
  } else {
    films.unshift(film);
  }
  saveAllFilms(films);
}

export function getFilmById(id: string): CinemaDocument | null {
  const films = getStoredFilms();
  return films.find(f => f.id === id) || null;
}

export function deleteFilm(id: string): void {
  const films = getStoredFilms().filter(f => f.id !== id);
  saveAllFilms(films);
}

export function getActiveFilmId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACTIVE_FILM_KEY);
}

export function setActiveFilmId(id: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ACTIVE_FILM_KEY, id);
}

export function createNewFilm(title = 'Untitled Screenplay'): CinemaDocument {
  const initialScript = `EXT. CITY ROOFTOP — DUSK

The horizon burns in indigo and pale amber. Wind sweeps across the gravel roof.

A lone figure watches the distant highway lights begin to ignite.

CUT TO:`;

  const newDoc = parseScreenplay(initialScript, {
    id: `film-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    title,
    author: 'Anonymous Writer',
    directorStyle: 'noir_cold',
  });
  saveFilm(newDoc);
  setActiveFilmId(newDoc.id);
  return newDoc;
}
