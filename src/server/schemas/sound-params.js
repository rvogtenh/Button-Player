// Global server-managed state.
// Sound parameters have moved to 'group-params' (one instance per group).
export default {
  // List of available audio files — populated by server at startup
  audioFiles: {
    type: 'any',
    default: [],
  },

  // Incremented by controller to force all players back to landing page
  resetCounter: {
    type: 'integer',
    default: 0,
  },
};
