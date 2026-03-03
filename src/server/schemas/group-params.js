// Per-group sound parameters. The server creates exactly 2 instances (groupId 0 and 1).
// The controller writes to each group independently; players in the group read and play.
export default {
  groupId: {
    type: 'integer',
    default: 0,
  },

  mode: {
    type: 'enum',
    list: ['synth', 'sample'],
    default: 'synth',
  },

  masterGain: {
    type: 'float',
    min: 0,
    max: 1,
    default: 0.5,
  },

  oscType0: {
    type: 'enum',
    list: ['sine', 'square', 'sawtooth', 'triangle'],
    default: 'sine',
  },
  oscFreq0: {
    type: 'float',
    min: 20,
    max: 5000,
    default: 220,
  },

  oscType1: {
    type: 'enum',
    list: ['sine', 'square', 'sawtooth', 'triangle'],
    default: 'sine',
  },
  oscFreq1: {
    type: 'float',
    min: 20,
    max: 5000,
    default: 440,
  },

  oscType2: {
    type: 'enum',
    list: ['sine', 'square', 'sawtooth', 'triangle'],
    default: 'sine',
  },
  oscFreq2: {
    type: 'float',
    min: 20,
    max: 5000,
    default: 660,
  },

  // ADSR (synth: full ADSR; sample: only attack + release)
  attack: {
    type: 'float',
    min: 0.001,
    max: 2.0,
    default: 0.03,
  },
  decay: {
    type: 'float',
    min: 0.001,
    max: 2.0,
    default: 0.1,
  },
  sustain: {
    type: 'float',
    min: 0,
    max: 1,
    default: 0.7,
  },
  release: {
    type: 'float',
    min: 0.01,
    max: 5.0,
    default: 1.5,
  },

  sampleFile: {
    type: 'string',
    default: '',
  },
};
