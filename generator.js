/**
 * generator.js
 * Cryptographically secure password generation.
 * Uses crypto.getRandomValues() — never Math.random().
 * Fully local, zero network calls.
 */

// --- Word list for memorable passwords (diceware-style, curated subset) ---
const WORDLIST = [
  'apple', 'arrow', 'beach', 'blade', 'blaze', 'bloom', 'board', 'brave',
  'brick', 'bridge', 'brush', 'cabin', 'candy', 'cargo', 'cedar', 'chain',
  'charm', 'chase', 'chess', 'chill', 'cliff', 'climb', 'cloud', 'cobra',
  'comet', 'coral', 'crane', 'crisp', 'crown', 'crush', 'curve', 'dance',
  'delta', 'drift', 'eagle', 'ember', 'fable', 'feast', 'flame', 'flash',
  'fleet', 'flint', 'flora', 'forge', 'frost', 'glade', 'gleam', 'globe',
  'grain', 'grape', 'grove', 'guard', 'haven', 'heart', 'honey', 'hound',
  'ivory', 'jewel', 'joint', 'joker', 'juice', 'karma', 'kite', 'knack',
  'lance', 'latch', 'lemon', 'light', 'lunar', 'magic', 'mango', 'maple',
  'marsh', 'medal', 'melon', 'merge', 'metal', 'mirth', 'mocha', 'mount',
  'noble', 'ocean', 'olive', 'orbit', 'otter', 'oxide', 'panel', 'pearl',
  'peach', 'pilot', 'pixel', 'plank', 'plaza', 'plume', 'polar', 'prism',
  'pulse', 'quake', 'quest', 'radar', 'raven', 'ridge', 'river', 'robin',
  'royal', 'rumba', 'sable', 'scale', 'scout', 'shade', 'shark', 'shell',
  'shine', 'sigma', 'slate', 'slide', 'slope', 'solar', 'spark', 'spice',
  'spike', 'spine', 'spoke', 'spray', 'stain', 'stamp', 'steel', 'sting',
  'stone', 'storm', 'sugar', 'surge', 'swamp', 'swift', 'sword', 'table',
  'thorn', 'tiger', 'toast', 'topic', 'tower', 'trace', 'trail', 'train',
  'trout', 'tulip', 'ultra', 'unity', 'valve', 'vault', 'vigor', 'viper',
  'vivid', 'wagon', 'waltz', 'whale', 'wheat', 'willow', 'witch', 'xenon',
  'yacht', 'yield', 'zebra', 'pixel', 'bliss', 'brine', 'cedar', 'dingo',
  'elbow', 'fjord', 'glyph', 'haste', 'index', 'juice', 'kayak', 'lyric',
  'mural', 'nexus', 'onset', 'plaid', 'quirk', 'resin', 'swirl', 'tempo',
  'umbra', 'vodka', 'whisk', 'oxide', 'yeast', 'zonal', 'agile', 'basil',
  'cider', 'dwarf', 'epoch', 'flair', 'ghost', 'helix', 'ionic', 'jazzy'
];

const CHARSETS = {
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  digits: '0123456789',
  symbols: '!@#$%^&*_+-=?'
};

/**
 * Get a cryptographically secure random integer in [0, max).
 */
function secureRandomInt(max) {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return array[0] % max;
}

/**
 * Generate a standard secure password.
 * @param {object} options
 * @param {number} options.length - Password length (default: 16)
 * @param {boolean} options.uppercase - Include uppercase (default: true)
 * @param {boolean} options.lowercase - Include lowercase (default: true)
 * @param {boolean} options.digits - Include digits (default: true)
 * @param {boolean} options.symbols - Include symbols (default: true)
 * @returns {string} Generated password
 */
function generateStandardPassword(options = {}) {
  const {
    length = 16,
    uppercase = true,
    lowercase = true,
    digits = true,
    symbols = true
  } = options;

  let charset = '';
  const required = [];

  if (uppercase) {
    charset += CHARSETS.uppercase;
    required.push(CHARSETS.uppercase[secureRandomInt(CHARSETS.uppercase.length)]);
  }
  if (lowercase) {
    charset += CHARSETS.lowercase;
    required.push(CHARSETS.lowercase[secureRandomInt(CHARSETS.lowercase.length)]);
  }
  if (digits) {
    charset += CHARSETS.digits;
    required.push(CHARSETS.digits[secureRandomInt(CHARSETS.digits.length)]);
  }
  if (symbols) {
    charset += CHARSETS.symbols;
    required.push(CHARSETS.symbols[secureRandomInt(CHARSETS.symbols.length)]);
  }

  if (charset.length === 0) {
    charset = CHARSETS.lowercase + CHARSETS.digits;
  }

  // Generate remaining characters
  const remaining = length - required.length;
  const chars = [...required];
  for (let i = 0; i < remaining; i++) {
    chars.push(charset[secureRandomInt(charset.length)]);
  }

  // Fisher-Yates shuffle using secure random
  for (let i = chars.length - 1; i > 0; i--) {
    const j = secureRandomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return chars.join('');
}

/**
 * Generate a memorable password (word-based, like "correct-horse-battery-staple").
 * @param {object} options
 * @param {number} options.wordCount - Number of words (default: 4)
 * @param {string} options.separator - Word separator (default: '-')
 * @param {boolean} options.capitalize - Capitalize first letter of each word (default: true)
 * @param {boolean} options.appendNumber - Append a random digit (default: true)
 * @returns {string} Generated memorable password
 */
function generateMemorablePassword(options = {}) {
  const {
    wordCount = 4,
    separator = '-',
    capitalize = true,
    appendNumber = true
  } = options;

  const words = [];
  const usedIndices = new Set();

  for (let i = 0; i < wordCount; i++) {
    let idx;
    do {
      idx = secureRandomInt(WORDLIST.length);
    } while (usedIndices.has(idx));
    usedIndices.add(idx);

    let word = WORDLIST[idx];
    if (capitalize) {
      word = word.charAt(0).toUpperCase() + word.slice(1);
    }
    words.push(word);
  }

  let result = words.join(separator);
  if (appendNumber) {
    result += separator + secureRandomInt(100);
  }

  return result;
}

/**
 * Calculate password strength (0-4 scale).
 * @param {string} password
 * @returns {{ score: number, label: string, color: string }}
 */
function calculateStrength(password) {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (password.length >= 16) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  // Normalize to 0-4
  score = Math.min(4, Math.floor(score * 4 / 6));

  const labels = ['Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
  const colors = ['#ef4444', '#f59e0b', '#eab308', '#22c55e', '#10b981'];

  return {
    score,
    label: labels[score],
    color: colors[score]
  };
}
