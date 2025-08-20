import React, { createContext, useContext, useState, ReactNode } from 'react';

export type CardType = 'track' | 'playlist' | 'album';

export type SectionType =
  | 'recent-tracks'
  | 'top-tracks'
  | 'saved-tracks'
  | 'saved-playlists'
  | 'saved-albums';

export interface ExpandedCard {
  sectionType: SectionType;
  cardType: CardType;
  index: number;
}

export interface ExpansionContextType {
  expandedCard: ExpandedCard | null;
  isExpanded: (_sectionType: SectionType, _cardType: CardType, _index: number) => boolean;
  toggleExpansion: (_sectionType: SectionType, _cardType: CardType, _index: number) => void;
  collapseAll: () => void;
}

const ExpansionContext = createContext<ExpansionContextType | undefined>(undefined);

interface ExpansionProviderProps {
  children: ReactNode;
}

export const ExpansionProvider: React.FC<ExpansionProviderProps> = ({ children }) => {
  const [expandedCard, setExpandedCard] = useState<ExpandedCard | null>(null);

  const isExpanded = (sectionType: SectionType, cardType: CardType, index: number): boolean => {
    if (!expandedCard) return false;

    return (
      expandedCard.sectionType === sectionType &&
      expandedCard.cardType === cardType &&
      expandedCard.index === index
    );
  };

  const toggleExpansion = (sectionType: SectionType, cardType: CardType, index: number): void => {
    const currentlyExpanded = isExpanded(sectionType, cardType, index);

    if (currentlyExpanded) {
      // If clicking the same card, collapse it
      setExpandedCard(null);
    } else {
      // If clicking a different card, expand it (this automatically collapses any other)
      setExpandedCard({
        sectionType,
        cardType,
        index,
      });
    }
  };

  const collapseAll = (): void => {
    setExpandedCard(null);
  };

  const value: ExpansionContextType = {
    expandedCard,
    isExpanded,
    toggleExpansion,
    collapseAll,
  };

  return <ExpansionContext.Provider value={value}>{children}</ExpansionContext.Provider>;
};

export const useExpansion = () => {
  const context = useContext(ExpansionContext);
  if (context === undefined) {
    throw new Error('useExpansion must be used within an ExpansionProvider');
  }
  return context;
};
