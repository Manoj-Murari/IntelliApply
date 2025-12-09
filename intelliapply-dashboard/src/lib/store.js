
import { create } from 'zustand';
import { createAuthSlice } from './slices/createAuthSlice';
import { createJobSlice } from './slices/createJobSlice';
import { createProfileSlice } from './slices/createProfileSlice';
import { createUISlice } from './slices/createUISlice';
import { createAISlice } from './slices/createAISlice';

export const useStore = create((...a) => ({
  ...createAuthSlice(...a),
  ...createJobSlice(...a),
  ...createProfileSlice(...a),
  ...createUISlice(...a),
  ...createAISlice(...a),
}));