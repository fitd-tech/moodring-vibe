import React from 'react';
import { render } from '@testing-library/react-native';
import { taggingService } from '../../../services/taggingService';
import { Track } from '../../../types';

describe('CreatePlaylistPage Tag Exclusion Logic', () => {
  describe('song exclusion filtering', () => {
    it('should correctly identify songs to exclude using generateSongId', () => {
      // Sample tracks that might be returned from API calls
      const includedSongs: Track[] = [
        {
          name: 'Song A',
          artist: 'Artist 1',
          album: 'Album 1',
          album_image_url: 'http://example.com/image1.jpg',
          played_at: '2023-01-01T00:00:00Z',
        },
        {
          name: 'Song B',
          artist: 'Artist 2',
          album: 'Album 2',
          album_image_url: 'http://example.com/image2.jpg',
          played_at: '2023-01-02T00:00:00Z',
        },
        {
          name: 'Song C',
          artist: 'Artist 3',
          album: 'Album 3',
          album_image_url: 'http://example.com/image3.jpg',
          played_at: '2023-01-03T00:00:00Z',
        },
      ];

      const excludedSongs: Track[] = [
        {
          name: 'Song B',
          artist: 'Artist 2',
          album: 'Album 2',
          album_image_url: 'http://example.com/image2.jpg',
          played_at: '2023-01-02T00:00:00Z',
        },
        {
          name: 'Song D',
          artist: 'Artist 4', // This song is not in included, so won't affect result
          album: 'Album 4',
          album_image_url: 'http://example.com/image4.jpg',
          played_at: '2023-01-04T00:00:00Z',
        },
      ];

      // Apply the exclusion logic (same as in CreatePlaylistPage.tsx)
      const excludedSongIdentifiers = new Set(
        excludedSongs.map(song => taggingService.generateSongId(song.name, song.artist))
      );

      const filteredSongs = includedSongs.filter(song => {
        const songIdentifier = taggingService.generateSongId(song.name, song.artist);
        return !excludedSongIdentifiers.has(songIdentifier);
      });

      // Verify the logic works correctly
      expect(filteredSongs).toHaveLength(2);
      expect(filteredSongs[0].name).toBe('Song A');
      expect(filteredSongs[1].name).toBe('Song C');
      
      // Song B should be excluded
      expect(filteredSongs.find(song => song.name === 'Song B')).toBeUndefined();
    });

    it('should handle edge cases in song names and artists', () => {
      const includedSongs: Track[] = [
        {
          name: 'Song (Remix)',
          artist: 'Artist & Co.',
          album: 'Album',
          played_at: '2023-01-01T00:00:00Z',
        },
        {
          name: 'Song - Radio Edit',
          artist: 'Artist 123',
          album: 'Album',
          played_at: '2023-01-02T00:00:00Z',
        },
      ];

      const excludedSongs: Track[] = [
        {
          name: 'Song (Remix)',
          artist: 'Artist & Co.',
          album: 'Album',
          played_at: '2023-01-01T00:00:00Z',
        },
      ];

      // Apply exclusion logic
      const excludedSongIdentifiers = new Set(
        excludedSongs.map(song => taggingService.generateSongId(song.name, song.artist))
      );

      const filteredSongs = includedSongs.filter(song => {
        const songIdentifier = taggingService.generateSongId(song.name, song.artist);
        return !excludedSongIdentifiers.has(songIdentifier);
      });

      // Should exclude the song with special characters
      expect(filteredSongs).toHaveLength(1);
      expect(filteredSongs[0].name).toBe('Song - Radio Edit');
    });

    it('should be case insensitive', () => {
      const includedSongs: Track[] = [
        {
          name: 'SONG NAME',
          artist: 'ARTIST NAME',
          album: 'Album',
          played_at: '2023-01-01T00:00:00Z',
        },
      ];

      const excludedSongs: Track[] = [
        {
          name: 'song name',
          artist: 'artist name',
          album: 'Album',
          played_at: '2023-01-01T00:00:00Z',
        },
      ];

      // Apply exclusion logic
      const excludedSongIdentifiers = new Set(
        excludedSongs.map(song => taggingService.generateSongId(song.name, song.artist))
      );

      const filteredSongs = includedSongs.filter(song => {
        const songIdentifier = taggingService.generateSongId(song.name, song.artist);
        return !excludedSongIdentifiers.has(songIdentifier);
      });

      // Should exclude despite case differences
      expect(filteredSongs).toHaveLength(0);
    });
  });
});