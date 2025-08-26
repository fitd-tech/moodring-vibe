import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';
import { useSearch } from '../../hooks/useSearch';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { SearchResults } from './SearchResults';

interface SearchSectionProps {
  testID?: string;
}

export const SearchSection: React.FC<SearchSectionProps> = ({ testID }) => {
  const {
    searchState,
    updateQuery,
    loadMore,
    clearSearch,
    isSearching,
    hasResults,
    canLoadMore,
  } = useSearch();

  const handleClearSearch = () => {
    clearSearch();
  };

  return (
    <View style={styles.container} testID={testID}>
      <Text style={styles.sectionTitle}>Search</Text>
      
      <View style={styles.searchInputContainer}>
        <View style={styles.searchIcon}>
          <Ionicons 
            name="search" 
            size={20} 
            color={theme.colors.text.secondary} 
          />
        </View>
        
        <TextInput
          style={styles.searchInput}
          placeholder="Search songs, artists, albums, playlists..."
          placeholderTextColor={theme.colors.text.muted}
          value={searchState.query}
          onChangeText={updateQuery}
          testID="search-input"
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
        />
        
        {searchState.query.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={handleClearSearch}
            testID="clear-search-button"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name="close-circle"
              size={20}
              color={theme.colors.text.secondary}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Loading indicator */}
      {isSearching && (
        <View style={styles.loadingContainer}>
          <LoadingSpinner text="Searching..." size="small" compact />
        </View>
      )}

      {/* Error state */}
      {searchState.error && (
        <View style={styles.errorContainer}>
          <Ionicons
            name="alert-circle"
            size={20}
            color={theme.colors.accent.pink}
            style={styles.errorIcon}
          />
          <Text style={styles.errorText}>{searchState.error}</Text>
        </View>
      )}

      {/* Search results */}
      {hasResults && !isSearching && (
        <SearchResults
          results={searchState.results}
          onLoadMore={loadMore}
          canLoadMore={canLoadMore}
          isLoadingMore={isSearching}
          totalResults={searchState.totalResults}
        />
      )}

      {/* No results state */}
      {!isSearching && 
       !hasResults && 
       searchState.query.trim().length > 0 && 
       !searchState.error && (
        <View style={styles.noResultsContainer}>
          <Ionicons
            name="search"
            size={32}
            color={theme.colors.text.muted}
            style={styles.noResultsIcon}
          />
          <Text style={styles.noResultsText}>
            No results found for "{searchState.query}"
          </Text>
          <Text style={styles.noResultsSubtext}>
            Try searching with different keywords
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.lg,
    letterSpacing: theme.typography.letterSpacing.sm,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
  },
  searchIcon: {
    marginRight: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.primary,
    paddingVertical: theme.spacing.xs,
  },
  clearButton: {
    marginLeft: theme.spacing.sm,
    padding: theme.spacing.xs,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.ui.overlay,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  errorIcon: {
    marginRight: theme.spacing.sm,
  },
  errorText: {
    flex: 1,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
  },
  noResultsContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  noResultsIcon: {
    marginBottom: theme.spacing.md,
  },
  noResultsText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  noResultsSubtext: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
});