import { ImageSourcePropType } from 'react-native';

export type ThumbnailKey =
  | 'music'
  | 'movies'
  | 'gaming'
  | 'books'
  | 'cooking'
  | 'travel'
  | 'fitness'
  | 'photo'
  | 'art'
  | 'tech'
  | 'fashion'
  | 'pets'
  | 'nature'
  | 'cafe'
  | 'meditation'
  | 'anime'
  | 'diy'
  | 'business'
  | 'science'
  | 'sports'
  | 'dance'
  | 'language'
  | 'film'
  | 'startup'
  | 'wellness'
  | 'garden'
  | 'astronomy'
  | 'writing'
  | 'study'
  | 'random';

export const THUMBNAIL_SOURCES: Record<ThumbnailKey, ImageSourcePropType> = {
  music: require('../../assets/thumbnails/ct01-music.png'),
  movies: require('../../assets/thumbnails/ct02-movies.png'),
  gaming: require('../../assets/thumbnails/ct03-gaming.png'),
  books: require('../../assets/thumbnails/ct04-books.png'),
  cooking: require('../../assets/thumbnails/ct05-cooking.png'),
  travel: require('../../assets/thumbnails/ct06-travel.png'),
  fitness: require('../../assets/thumbnails/ct07-fitness.png'),
  photo: require('../../assets/thumbnails/ct08-photo.png'),
  art: require('../../assets/thumbnails/ct09-art.png'),
  tech: require('../../assets/thumbnails/ct10-tech.png'),
  fashion: require('../../assets/thumbnails/ct11-fashion.png'),
  pets: require('../../assets/thumbnails/ct12-pets.png'),
  nature: require('../../assets/thumbnails/ct13-nature.png'),
  cafe: require('../../assets/thumbnails/ct14-cafe.png'),
  meditation: require('../../assets/thumbnails/ct15-meditation.png'),
  anime: require('../../assets/thumbnails/ct16-anime.png'),
  diy: require('../../assets/thumbnails/ct17-diy.png'),
  business: require('../../assets/thumbnails/ct18-business.png'),
  science: require('../../assets/thumbnails/ct19-science.png'),
  sports: require('../../assets/thumbnails/ct20-sports.png'),
  dance: require('../../assets/thumbnails/ct21-dance.png'),
  language: require('../../assets/thumbnails/ct22-language.png'),
  film: require('../../assets/thumbnails/ct23-film.png'),
  startup: require('../../assets/thumbnails/ct24-startup.png'),
  wellness: require('../../assets/thumbnails/ct25-wellness.png'),
  garden: require('../../assets/thumbnails/ct26-garden.png'),
  astronomy: require('../../assets/thumbnails/ct27-astronomy.png'),
  writing: require('../../assets/thumbnails/ct28-writing.png'),
  study: require('../../assets/thumbnails/ct29-study.png'),
  random: require('../../assets/thumbnails/ct30-random.png'),
};

export const THUMBNAIL_KEYS: ThumbnailKey[] = Object.keys(THUMBNAIL_SOURCES) as ThumbnailKey[];

export function getThumbnailSource(keyOrUrl: string | null): ImageSourcePropType | null {
  if (!keyOrUrl) return null;
  if (keyOrUrl.startsWith('http')) return { uri: keyOrUrl };
  return THUMBNAIL_SOURCES[keyOrUrl as ThumbnailKey] ?? null;
}
