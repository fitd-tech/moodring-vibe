import React, { ReactNode } from 'react';
import { ExpansionProvider, ExpansionContextType } from '../ExpansionContext';

// Mock expansion context for testing
export const createMockExpansionContext = (
  overrides: Partial<ExpansionContextType> = {}
): ExpansionContextType => ({
  expandedCard: null,
  isExpanded: jest.fn().mockReturnValue(false),
  toggleExpansion: jest.fn(),
  collapseAll: jest.fn(),
  ...overrides,
});

// Test wrapper component that provides ExpansionContext
export const ExpansionTestWrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ExpansionProvider>{children}</ExpansionProvider>
);

// Mock the useExpansion hook for testing
export const mockUseExpansion = (mockContext: Partial<ExpansionContextType> = {}) => {
  const fullContext = createMockExpansionContext(mockContext);

  jest.doMock('../ExpansionContext', () => ({
    ...jest.requireActual('../ExpansionContext'),
    useExpansion: () => fullContext,
  }));

  return fullContext;
};

// Dummy test to prevent Jest from treating this as an empty test suite
describe('testUtils', () => {
  it('should export test utilities', () => {
    expect(ExpansionTestWrapper).toBeDefined();
    expect(createMockExpansionContext).toBeDefined();
    expect(mockUseExpansion).toBeDefined();
  });
});
