// Lightweight per-player state created on join, deleted on disconnect or reset.
// Used by the controller to display which players are in which group.
export default {
  clientId: {
    type: 'integer',
    default: -1,
  },
  groupId: {
    type: 'integer',
    default: 0,
  },
};
