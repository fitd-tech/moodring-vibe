import { playlistService } from '../playlistService';
import { spotifyApi } from '../spotifyApi';
import { taggingService } from '../taggingService';

// Mock the dependencies
jest.mock('../spotifyApi');
jest.mock('../taggingService');

const mockedSpotifyApi = spotifyApi as jest.Mocked<typeof spotifyApi>;
const mockedTaggingService = taggingService as jest.Mocked<typeof taggingService>;

describe('PlaylistService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getSongsWithTags', () => {
    it('should fetch ALL saved tracks, not just the first 50', async () => {
      const userId = 1;
      const tagIds = [1, 2];
      const spotifyToken = 'test-token';

      // Mock tagged song IDs
      mockedTaggingService.getSongsWithTag
        .mockResolvedValueOnce(['song1', 'song2'])
        .mockResolvedValueOnce(['song3', 'song4']);

      mockedTaggingService.generateSongId = jest.fn()
        .mockReturnValueOnce('song1')
        .mockReturnValueOnce('song2')
        .mockReturnValueOnce('song3')
        .mockReturnValueOnce('song4');

      // Mock Spotify API to return tracks in multiple pages
      const firstPageTracks = Array.from({ length: 50 }, (_, i) => ({
        name: `Track ${i + 1}`,
        artist: `Artist ${i + 1}`,
        album: `Album ${i + 1}`,
        album_image_url: `image${i + 1}.jpg`,
        song_id: `track${i + 1}`,
        added_at: '2023-01-01',
      }));

      const secondPageTracks = Array.from({ length: 30 }, (_, i) => ({
        name: `Track ${i + 51}`,
        artist: `Artist ${i + 51}`,
        album: `Album ${i + 51}`,
        album_image_url: `image${i + 51}.jpg`,
        song_id: `track${i + 51}`,
        added_at: '2023-01-01',
      }));

      // Mock first page (50 tracks) and second page (30 tracks)
      mockedSpotifyApi.getSavedTracks.mockResolvedValueOnce(firstPageTracks);
      mockedSpotifyApi.getMoreSavedTracks.mockResolvedValueOnce(secondPageTracks);

      const result = await playlistService.getSongsWithTags(userId, tagIds, spotifyToken);

      // Verify that pagination was used
      expect(mockedSpotifyApi.getSavedTracks).toHaveBeenCalledWith(spotifyToken, 50);
      expect(mockedSpotifyApi.getMoreSavedTracks).toHaveBeenCalledWith(spotifyToken, 50);

      // Verify that all tagged songs were found
      expect(result).toHaveLength(4); // Should find all 4 tagged songs
    });

    it('should handle empty tag IDs', async () => {
      const result = await playlistService.getSongsWithTags(1, [], 'token');
      expect(result).toEqual([]);
    });

    it('should handle no tagged songs', async () => {
      mockedTaggingService.getSongsWithTag.mockResolvedValue([]);
      const result = await playlistService.getSongsWithTags(1, [1], 'token');
      expect(result).toEqual([]);
    });
  });

  describe('getAlbumsWithTags', () => {
    it('should fetch ALL saved albums, not just the first 20', async () => {
      const userId = 1;
      const tagIds = [1];
      const spotifyToken = 'test-token';

      // Mock tagged album IDs
      mockedTaggingService.getSongsWithTag.mockResolvedValueOnce(['album_id1', 'album_id2']);
      mockedTaggingService.generateAlbumId = jest.fn()
        .mockReturnValueOnce('album_id1')
        .mockReturnValueOnce('album_id2');

      // Mock Spotify API to return albums in multiple pages
      const firstPageAlbums = Array.from({ length: 20 }, (_, i) => ({
        name: `Album ${i + 1}`,
        artist: `Artist ${i + 1}`,
        image_url: `image${i + 1}.jpg`,
        release_date: '2023-01-01',
        track_count: 10,
        album_id: `album${i + 1}`,
      }));

      const secondPageAlbums = Array.from({ length: 10 }, (_, i) => ({
        name: `Album ${i + 21}`,
        artist: `Artist ${i + 21}`,
        image_url: `image${i + 21}.jpg`,
        release_date: '2023-01-01',
        track_count: 10,
        album_id: `album${i + 21}`,
      }));

      mockedSpotifyApi.getSavedAlbums.mockResolvedValueOnce(firstPageAlbums);
      mockedSpotifyApi.getMoreSavedAlbums.mockResolvedValueOnce(secondPageAlbums);

      const result = await playlistService.getAlbumsWithTags(userId, tagIds, spotifyToken);

      // Verify that pagination was used
      expect(mockedSpotifyApi.getSavedAlbums).toHaveBeenCalledWith(spotifyToken, 20);
      expect(mockedSpotifyApi.getMoreSavedAlbums).toHaveBeenCalledWith(spotifyToken, 20);

      // Should find matching albums
      expect(result).toHaveLength(2);
    });
  });

  describe('getPlaylistsWithTags', () => {
    it('should fetch ALL saved playlists, not just the first 20', async () => {
      const userId = 1;
      const tagIds = [1];
      const spotifyToken = 'test-token';

      // Mock tagged playlist IDs
      mockedTaggingService.getSongsWithTag.mockResolvedValueOnce(['playlist_id1', 'playlist_id2']);
      mockedTaggingService.generatePlaylistId = jest.fn()
        .mockReturnValueOnce('playlist_id1')
        .mockReturnValueOnce('playlist_id2');

      // Mock Spotify API to return playlists in multiple pages
      const firstPagePlaylists = Array.from({ length: 20 }, (_, i) => ({
        name: `Playlist ${i + 1}`,
        description: `Description ${i + 1}`,
        image_url: `image${i + 1}.jpg`,
        track_count: 50,
        created_at: '2023-01-01',
        playlist_id: `playlist${i + 1}`,
      }));

      const secondPagePlaylists = Array.from({ length: 5 }, (_, i) => ({
        name: `Playlist ${i + 21}`,
        description: `Description ${i + 21}`,
        image_url: `image${i + 21}.jpg`,
        track_count: 50,
        created_at: '2023-01-01',
        playlist_id: `playlist${i + 21}`,
      }));

      mockedSpotifyApi.getSavedPlaylists.mockResolvedValueOnce(firstPagePlaylists);
      mockedSpotifyApi.getMoreSavedPlaylists.mockResolvedValueOnce(secondPagePlaylists);

      const result = await playlistService.getPlaylistsWithTags(userId, tagIds, spotifyToken);

      // Verify that pagination was used
      expect(mockedSpotifyApi.getSavedPlaylists).toHaveBeenCalledWith(spotifyToken, 20);
      expect(mockedSpotifyApi.getMoreSavedPlaylists).toHaveBeenCalledWith(spotifyToken, 20);

      // Should find matching playlists
      expect(result).toHaveLength(2);
    });
  });

  describe('getFilteredContent', () => {
    it('should return ALL songs that match selected tags, not just from first 50 tracks', async () => {
      const userId = 1;
      const tagIds = [1, 2];
      const contentTypes: ('songs' | 'albums' | 'playlists')[] = ['songs'];
      const spotifyToken = 'test-token';

      // Mock that we have 5 tagged songs
      mockedTaggingService.getSongsWithTag
        .mockResolvedValueOnce(['song1', 'song2', 'song3'])
        .mockResolvedValueOnce(['song4', 'song5']);

      mockedTaggingService.generateSongId = jest.fn()
        .mockReturnValueOnce('song1')
        .mockReturnValueOnce('song2')
        .mockReturnValueOnce('song3')
        .mockReturnValueOnce('song4')
        .mockReturnValueOnce('song5');

      // Mock Spotify to return 100 tracks across 2 pages
      const firstPageTracks = Array.from({ length: 50 }, (_, i) => ({
        name: `Track ${i + 1}`,
        artist: `Artist ${i + 1}`,
        album: `Album ${i + 1}`,
        album_image_url: `image${i + 1}.jpg`,
        song_id: `track${i + 1}`,
        added_at: '2023-01-01',
      }));

      const secondPageTracks = Array.from({ length: 50 }, (_, i) => ({
        name: `Track ${i + 51}`,
        artist: `Artist ${i + 51}`,
        album: `Album ${i + 51}`,
        album_image_url: `image${i + 51}.jpg`,
        song_id: `track${i + 51}`,
        added_at: '2023-01-01',
      }));

      mockedSpotifyApi.getSavedTracks.mockResolvedValueOnce(firstPageTracks);
      mockedSpotifyApi.getMoreSavedTracks.mockResolvedValueOnce(secondPageTracks);

      const result = await playlistService.getFilteredContent(userId, tagIds, contentTypes, spotifyToken);

      // Should return all 5 tagged songs, regardless of pagination
      expect(result).toHaveLength(5);

      // Verify both pages were fetched
      expect(mockedSpotifyApi.getSavedTracks).toHaveBeenCalledWith(spotifyToken, 50);
      expect(mockedSpotifyApi.getMoreSavedTracks).toHaveBeenCalledWith(spotifyToken, 50);
    });
  });
});