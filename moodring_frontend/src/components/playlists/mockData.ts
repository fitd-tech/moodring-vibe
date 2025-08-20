import { Track, Tag } from '../../types';

// Mock tag data with 90's retro-inspired names
export const mockTags: Tag[] = [
  { id: 1, user_id: 1, name: 'Neon Dreams', color: '#ff00ff', created_at: '2024-01-15T08:30:00Z', updated_at: '2024-01-15T08:30:00Z' },
  { id: 2, user_id: 1, name: 'Synthwave Vibes', color: '#00ffff', created_at: '2024-01-15T09:15:00Z', updated_at: '2024-01-15T09:15:00Z' },
  { id: 3, user_id: 1, name: 'Arcade Nights', color: '#ff6600', created_at: '2024-01-15T10:00:00Z', updated_at: '2024-01-15T10:00:00Z' },
  { id: 4, user_id: 1, name: 'Electric Pop', color: '#ffff00', created_at: '2024-01-15T10:45:00Z', updated_at: '2024-01-15T10:45:00Z' },
  { id: 5, user_id: 1, name: 'Retro Gaming', color: '#9900ff', created_at: '2024-01-15T11:30:00Z', updated_at: '2024-01-15T11:30:00Z' },
  { id: 6, user_id: 1, name: 'Cyberpunk', color: '#ff0066', created_at: '2024-01-15T12:15:00Z', updated_at: '2024-01-15T12:15:00Z' },
  { id: 7, user_id: 1, name: 'VHS Aesthetic', color: '#66ff00', created_at: '2024-01-15T13:00:00Z', updated_at: '2024-01-15T13:00:00Z' },
  { id: 8, user_id: 1, name: 'Laser Light Show', color: '#00ff99', created_at: '2024-01-15T13:45:00Z', updated_at: '2024-01-15T13:45:00Z' },
  { id: 9, user_id: 1, name: 'Geometric Patterns', color: '#ff3300', created_at: '2024-01-15T14:30:00Z', updated_at: '2024-01-15T14:30:00Z' },
  { id: 10, user_id: 1, name: 'Miami Vice', color: '#ff9900', created_at: '2024-01-15T15:15:00Z', updated_at: '2024-01-15T15:15:00Z' },
  { id: 11, user_id: 1, name: 'Holographic', color: '#3366ff', created_at: '2024-01-16T08:00:00Z', updated_at: '2024-01-16T08:00:00Z' },
  { id: 12, user_id: 1, name: 'Chrome Dreams', color: '#cc00ff', created_at: '2024-01-16T08:45:00Z', updated_at: '2024-01-16T08:45:00Z' },
  { id: 13, user_id: 1, name: 'Neon Jungle', color: '#00cc66', created_at: '2024-01-16T09:30:00Z', updated_at: '2024-01-16T09:30:00Z' },
  { id: 14, user_id: 1, name: 'Digital Rain', color: '#0066cc', created_at: '2024-01-16T10:15:00Z', updated_at: '2024-01-16T10:15:00Z' },
  { id: 15, user_id: 1, name: 'Pixel Perfect', color: '#ff6699', created_at: '2024-01-16T11:00:00Z', updated_at: '2024-01-16T11:00:00Z' },
  { id: 16, user_id: 1, name: 'Space Disco', color: '#9966ff', created_at: '2024-01-16T11:45:00Z', updated_at: '2024-01-16T11:45:00Z' },
  { id: 17, user_id: 1, name: 'Neon Gothic', color: '#ff0099', created_at: '2024-01-16T12:30:00Z', updated_at: '2024-01-16T12:30:00Z' },
  { id: 18, user_id: 1, name: 'Circuit Board', color: '#33ff00', created_at: '2024-01-16T13:15:00Z', updated_at: '2024-01-16T13:15:00Z' },
  { id: 19, user_id: 1, name: 'Vapor Trail', color: '#ff3366', created_at: '2024-01-16T14:00:00Z', updated_at: '2024-01-16T14:00:00Z' },
  { id: 20, user_id: 1, name: 'Electric Dreams', color: '#00ffcc', created_at: '2024-01-16T14:45:00Z', updated_at: '2024-01-16T14:45:00Z' },
  { id: 21, user_id: 1, name: 'Laser Grid', color: '#ff6600', created_at: '2024-01-17T08:00:00Z', updated_at: '2024-01-17T08:00:00Z' },
  { id: 22, user_id: 1, name: 'Neon Lights', color: '#6600ff', created_at: '2024-01-17T08:45:00Z', updated_at: '2024-01-17T08:45:00Z' },
  { id: 23, user_id: 1, name: 'Digital Sunset', color: '#ff9933', created_at: '2024-01-17T09:30:00Z', updated_at: '2024-01-17T09:30:00Z' },
  { id: 24, user_id: 1, name: 'Chrome City', color: '#3399ff', created_at: '2024-01-17T10:15:00Z', updated_at: '2024-01-17T10:15:00Z' },
  { id: 25, user_id: 1, name: 'Neon Underground', color: '#99ff33', created_at: '2024-01-17T11:00:00Z', updated_at: '2024-01-17T11:00:00Z' },
  { id: 26, user_id: 1, name: 'Virtual Reality', color: '#ff3399', created_at: '2024-01-17T11:45:00Z', updated_at: '2024-01-17T11:45:00Z' },
  { id: 27, user_id: 1, name: 'Pixel Dust', color: '#33ffcc', created_at: '2024-01-17T12:30:00Z', updated_at: '2024-01-17T12:30:00Z' },
  { id: 28, user_id: 1, name: 'Electric Storm', color: '#cc33ff', created_at: '2024-01-17T13:15:00Z', updated_at: '2024-01-17T13:15:00Z' },
  { id: 29, user_id: 1, name: 'Neon Noir', color: '#ff0033', created_at: '2024-01-17T14:00:00Z', updated_at: '2024-01-17T14:00:00Z' },
  { id: 30, user_id: 1, name: 'Cyber Paradise', color: '#00ff66', created_at: '2024-01-17T14:45:00Z', updated_at: '2024-01-17T14:45:00Z' },
];

// Mock song data with diverse music genres and 90's aesthetic
export const mockSongs: Track[] = [
  {
    name: 'Midnight Runner',
    artist: 'Neon Waves',
    album: 'Electric Nights',
    album_image_url: 'https://picsum.photos/300/300?random=1',
    played_at: '2024-01-20T22:30:00Z'
  } as Track,
  {
    name: 'Synthwave Dreams',
    artist: 'Chrome City',
    album: 'Digital Paradise',
    album_image_url: 'https://picsum.photos/300/300?random=2',
    played_at: '2024-01-20T21:45:00Z'
  } as Track,
  {
    name: 'Laser Light Symphony',
    artist: 'Pixel Perfect',
    album: 'Arcade Memories',
    album_image_url: 'https://picsum.photos/300/300?random=3',
    played_at: '2024-01-20T21:00:00Z'
  } as Track,
  {
    name: 'Neon Jungle Beat',
    artist: 'Electric Dreams',
    album: 'Cyber Safari',
    album_image_url: 'https://picsum.photos/300/300?random=4',
    played_at: '2024-01-20T20:15:00Z'
  } as Track,
  {
    name: 'Virtual Reality Check',
    artist: 'Digital Rain',
    album: 'Matrix Vibes',
    album_image_url: 'https://picsum.photos/300/300?random=5',
    played_at: '2024-01-20T19:30:00Z'
  } as Track,
  {
    name: 'Chrome Horizons',
    artist: 'Vapor Trail',
    album: 'Holographic World',
    album_image_url: 'https://picsum.photos/300/300?random=6',
    played_at: '2024-01-20T18:45:00Z'
  } as Track,
  {
    name: 'Electric Pulse',
    artist: 'Circuit Board',
    album: 'Binary Beats',
    album_image_url: 'https://picsum.photos/300/300?random=7',
    played_at: '2024-01-20T18:00:00Z'
  } as Track,
  {
    name: 'Geometric Patterns',
    artist: 'Laser Grid',
    album: 'Mathematical Music',
    album_image_url: 'https://picsum.photos/300/300?random=8',
    played_at: '2024-01-20T17:15:00Z'
  } as Track,
  {
    name: 'Miami Vice Nights',
    artist: 'Neon Gothic',
    album: 'Retro Romance',
    album_image_url: 'https://picsum.photos/300/300?random=9',
    played_at: '2024-01-20T16:30:00Z'
  } as Track,
  {
    name: 'Digital Sunset',
    artist: 'Space Disco',
    album: 'Cosmic Journey',
    album_image_url: 'https://picsum.photos/300/300?random=10',
    played_at: '2024-01-20T15:45:00Z'
  } as Track,
  {
    name: 'VHS Static Dreams',
    artist: 'Pixel Dust',
    album: 'Analog Digital',
    album_image_url: 'https://picsum.photos/300/300?random=11',
    played_at: '2024-01-20T15:00:00Z'
  } as Track,
  {
    name: 'Cyber Storm',
    artist: 'Electric Storm',
    album: 'Weather Machine',
    album_image_url: 'https://picsum.photos/300/300?random=12',
    played_at: '2024-01-20T14:15:00Z'
  } as Track,
  {
    name: 'Neon Underground',
    artist: 'Chrome Dreams',
    album: 'Urban Lights',
    album_image_url: 'https://picsum.photos/300/300?random=13',
    played_at: '2024-01-20T13:30:00Z'
  } as Track,
  {
    name: 'Holographic Love',
    artist: 'Cyber Paradise',
    album: 'Digital Hearts',
    album_image_url: 'https://picsum.photos/300/300?random=14',
    played_at: '2024-01-20T12:45:00Z'
  } as Track,
  {
    name: 'Arcade Fighter',
    artist: 'Neon Noir',
    album: 'Boss Battle',
    album_image_url: 'https://picsum.photos/300/300?random=15',
    played_at: '2024-01-20T12:00:00Z'
  } as Track,
];

// Interface for tag selection state
export interface TagSelectionState {
  id: number;
  name: string;
  color: string;
  isSelected: boolean;
}

// Convert tags to selectable format
export const createSelectableTags = (tags: Tag[]): TagSelectionState[] => {
  return tags.map(tag => ({
    id: tag.id,
    name: tag.name,
    color: tag.color || '#8a2be2',
    isSelected: false,
  }));
};