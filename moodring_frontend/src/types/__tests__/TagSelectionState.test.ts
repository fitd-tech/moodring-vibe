import { TagSelectionState } from '../index';

describe('TagSelectionState Interface', () => {
  describe('selectionState field validation', () => {
    it('accepts valid selectionState values', () => {
      const validStates: TagSelectionState['selectionState'][] = ['none', 'include', 'exclude'];
      
      validStates.forEach(state => {
        const tagState: TagSelectionState = {
          id: 1,
          name: 'Test Tag',
          color: '#8a2be2',
          selectionState: state
        };
        
        expect(tagState.selectionState).toBe(state);
      });
    });

    it('creates proper tag state objects for each selection state', () => {
      const baseTag = {
        id: 1,
        name: 'Test Tag',
        color: '#8a2be2'
      };

      const noneState: TagSelectionState = {
        ...baseTag,
        selectionState: 'none'
      };

      const includeState: TagSelectionState = {
        ...baseTag,
        selectionState: 'include'
      };

      const excludeState: TagSelectionState = {
        ...baseTag,
        selectionState: 'exclude'
      };

      expect(noneState.selectionState).toBe('none');
      expect(includeState.selectionState).toBe('include');
      expect(excludeState.selectionState).toBe('exclude');
    });

    it('maintains all required fields', () => {
      const tagState: TagSelectionState = {
        id: 1,
        name: 'Test Tag',
        color: '#8a2be2',
        selectionState: 'none'
      };

      expect(tagState).toHaveProperty('id');
      expect(tagState).toHaveProperty('name');
      expect(tagState).toHaveProperty('color');
      expect(tagState).toHaveProperty('selectionState');
      
      expect(typeof tagState.id).toBe('number');
      expect(typeof tagState.name).toBe('string');
      expect(typeof tagState.color).toBe('string');
      expect(['none', 'include', 'exclude']).toContain(tagState.selectionState);
    });

    it('supports state transitions in arrays', () => {
      const tags: TagSelectionState[] = [
        { id: 1, name: 'Tag 1', color: '#8a2be2', selectionState: 'none' },
        { id: 2, name: 'Tag 2', color: '#ff6600', selectionState: 'include' },
        { id: 3, name: 'Tag 3', color: '#ff0000', selectionState: 'exclude' }
      ];

      expect(tags.length).toBe(3);
      expect(tags[0].selectionState).toBe('none');
      expect(tags[1].selectionState).toBe('include');
      expect(tags[2].selectionState).toBe('exclude');
    });
  });

  describe('state filtering helpers', () => {
    const mockTags: TagSelectionState[] = [
      { id: 1, name: 'Tag 1', color: '#8a2be2', selectionState: 'none' },
      { id: 2, name: 'Tag 2', color: '#ff6600', selectionState: 'include' },
      { id: 3, name: 'Tag 3', color: '#ff0000', selectionState: 'exclude' },
      { id: 4, name: 'Tag 4', color: '#00ff00', selectionState: 'include' },
      { id: 5, name: 'Tag 5', color: '#0000ff', selectionState: 'none' }
    ];

    it('filters included tags correctly', () => {
      const includedTags = mockTags.filter(tag => tag.selectionState === 'include');
      expect(includedTags).toHaveLength(2);
      expect(includedTags[0].id).toBe(2);
      expect(includedTags[1].id).toBe(4);
    });

    it('filters excluded tags correctly', () => {
      const excludedTags = mockTags.filter(tag => tag.selectionState === 'exclude');
      expect(excludedTags).toHaveLength(1);
      expect(excludedTags[0].id).toBe(3);
    });

    it('filters selected tags (include + exclude) correctly', () => {
      const selectedTags = mockTags.filter(tag => tag.selectionState !== 'none');
      expect(selectedTags).toHaveLength(3);
      expect(selectedTags.map(t => t.id)).toEqual([2, 3, 4]);
    });

    it('gets tag IDs for each state', () => {
      const includedIds = mockTags
        .filter(tag => tag.selectionState === 'include')
        .map(tag => tag.id);
      
      const excludedIds = mockTags
        .filter(tag => tag.selectionState === 'exclude')
        .map(tag => tag.id);

      expect(includedIds).toEqual([2, 4]);
      expect(excludedIds).toEqual([3]);
    });
  });

  describe('state transitions', () => {
    it('supports cycling through states', () => {
      const states: TagSelectionState['selectionState'][] = ['none', 'include', 'exclude'];
      
      let currentStateIndex = 0;
      const tag: TagSelectionState = {
        id: 1,
        name: 'Test Tag',
        color: '#8a2be2',
        selectionState: states[currentStateIndex]
      };

      // Simulate clicking through states
      expect(tag.selectionState).toBe('none');

      // none → include
      currentStateIndex = (currentStateIndex + 1) % states.length;
      tag.selectionState = states[currentStateIndex];
      expect(tag.selectionState).toBe('include');

      // include → exclude
      currentStateIndex = (currentStateIndex + 1) % states.length;
      tag.selectionState = states[currentStateIndex];
      expect(tag.selectionState).toBe('exclude');

      // exclude → none
      currentStateIndex = (currentStateIndex + 1) % states.length;
      tag.selectionState = states[currentStateIndex];
      expect(tag.selectionState).toBe('none');
    });

    it('handles rapid state transitions', () => {
      const states: TagSelectionState['selectionState'][] = ['none', 'include', 'exclude'];
      
      let currentStateIndex = 0;
      const tag: TagSelectionState = {
        id: 1,
        name: 'Test Tag',
        color: '#8a2be2',
        selectionState: states[currentStateIndex]
      };

      // Simulate 10 rapid clicks
      for (let i = 0; i < 10; i++) {
        currentStateIndex = (currentStateIndex + 1) % states.length;
        tag.selectionState = states[currentStateIndex];
      }

      // After 10 clicks, should be back to 'include' (10 % 3 = 1)
      expect(tag.selectionState).toBe('include');
    });
  });
});