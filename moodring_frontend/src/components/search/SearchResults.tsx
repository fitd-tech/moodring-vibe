import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SearchResult } from '../../types';
import { SearchResultCard } from './SearchResultCard';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { theme } from '../../styles/theme';

interface SearchResultsProps {
  results: SearchResult[];
  onLoadMore: () => void;
  canLoadMore: boolean;
  isLoadingMore: boolean;
  totalResults: number;
}

export const SearchResults: React.FC<SearchResultsProps> = ({
  results,
  onLoadMore,
  canLoadMore,
  isLoadingMore,
  totalResults,
}) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const handleToggleExpansion = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const getResultTypeCounts = () => {
    const counts = {
      track: 0,
      album: 0,
      playlist: 0,
    };

    results.forEach(result => {
      counts[result.type]++;
    });

    return counts;
  };

  const formatResultsSummary = () => {
    const counts = getResultTypeCounts();
    const parts = [];

    if (counts.track > 0) parts.push(`${counts.track} track${counts.track > 1 ? 's' : ''}`);
    if (counts.album > 0) parts.push(`${counts.album} album${counts.album > 1 ? 's' : ''}`);
    if (counts.playlist > 0) parts.push(`${counts.playlist} playlist${counts.playlist > 1 ? 's' : ''}`);

    if (parts.length === 0) return '';
    if (parts.length === 1) return parts[0];
    if (parts.length === 2) return parts.join(' and ');
    
    return parts.slice(0, -1).join(', ') + ', and ' + parts[parts.length - 1];
  };

  return (
    <View style={styles.container}>
      {/* Results summary */}
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryText}>
          Found {formatResultsSummary()}
        </Text>
        {totalResults > results.length && (
          <Text style={styles.totalText}>
            Showing {results.length} of {totalResults.toLocaleString()} total results
          </Text>
        )}
      </View>

      {/* Results list */}
      <View style={styles.resultsList}>
        {results.map((result, index) => (
          <SearchResultCard
            key={`${result.type}-${result.id}-${index}`}
            result={result}
            index={index}
            isExpanded={expandedIndex === index}
            onToggleExpansion={handleToggleExpansion}
          />
        ))}
      </View>

      {/* Load more button */}
      {canLoadMore && (
        <TouchableOpacity
          style={styles.loadMoreButton}
          onPress={onLoadMore}
          disabled={isLoadingMore}
          testID="load-more-button"
        >
          {isLoadingMore ? (
            <LoadingSpinner size="small" compact />
          ) : (
            <View style={styles.loadMoreContent}>
              <Ionicons
                name="add-circle-outline"
                size={20}
                color={theme.colors.accent.purple}
                style={styles.loadMoreIcon}
              />
              <Text style={styles.loadMoreText}>Load 10 more results</Text>
            </View>
          )}
        </TouchableOpacity>
      )}

      {/* End of results indicator */}
      {!canLoadMore && results.length > 10 && (
        <View style={styles.endOfResultsContainer}>
          <View style={styles.endOfResultsLine} />
          <Text style={styles.endOfResultsText}>End of results</Text>
          <View style={styles.endOfResultsLine} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  summaryContainer: {
    marginBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.sm,
  },
  summaryText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  totalText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  resultsList: {
    marginBottom: theme.spacing.lg,
  },
  loadMoreButton: {
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
    minHeight: 48,
  },
  loadMoreContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadMoreIcon: {
    marginRight: theme.spacing.sm,
  },
  loadMoreText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.accent.purple,
  },
  endOfResultsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: theme.spacing.lg,
  },
  endOfResultsLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.ui.border,
  },
  endOfResultsText: {
    marginHorizontal: theme.spacing.md,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.muted,
    fontStyle: 'italic',
  },
});