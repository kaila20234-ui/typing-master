// Common English words grouped by difficulty level
const beginnerWords = [
  'cat', 'dog', 'bird', 'fish', 'tree', 'house', 'car', 'book', 'pen', 'desk',
  'chair', 'table', 'door', 'window', 'wall', 'floor', 'roof', 'lamp', 'bed', 'cup',
  'plate', 'spoon', 'fork', 'knife', 'food', 'water', 'milk', 'bread', 'apple', 'orange',
  'hand', 'foot', 'head', 'eye', 'nose', 'ear', 'mouth', 'hair', 'face', 'skin',
  'sun', 'moon', 'star', 'cloud', 'rain', 'snow', 'wind', 'fire', 'ice', 'rock',
  'leaf', 'flower', 'grass', 'root', 'seed', 'fruit', 'vegetable', 'meat', 'fish', 'egg'
];

const intermediateWords = [
  'computer', 'keyboard', 'monitor', 'software', 'hardware', 'internet', 'website', 'browser', 'application', 'program',
  'language', 'grammar', 'vocabulary', 'sentence', 'paragraph', 'chapter', 'library', 'dictionary', 'encyclopedia', 'magazine',
  'adventure', 'challenge', 'journey', 'discovery', 'treasure', 'mystery', 'fantastic', 'wonderful', 'beautiful', 'terrible',
  'elephant', 'giraffe', 'penguin', 'dolphin', 'butterfly', 'crocodile', 'cheetah', 'kangaroo', 'peacock', 'parrot',
  'mountain', 'valley', 'desert', 'ocean', 'river', 'forest', 'island', 'volcano', 'glacier', 'canyon',
  'birthday', 'holiday', 'festival', 'celebration', 'ceremony', 'tradition', 'culture', 'history', 'geography', 'science'
];

const advancedWords = [
  'phenomenal', 'sophisticated', 'revolutionary', 'configuration', 'infrastructure', 'architecture', 'methodology', 'psychology', 'philosophy', 'technology',
  'astronomical', 'biophysical', 'chronological', 'demographic', 'environmental', 'geographical', 'hypothetical', 'meteorological', 'philosophical', 'sociological',
  'serendipitously', 'conscientiously', 'meticulously', 'enthusiastically', 'dramatically', 'strategically', 'systematically', 'theoretically', 'practically', 'scientifically',
  'anthropomorphism', 'colloquialism', 'dialectology', 'epistemology', 'eschatology', 'ontology', 'phenomenology', 'pragmatism', 'semantics', 'syntax',
  'pseudointellectual', 'multidimensional', 'macroeconomic', 'microeconomic', 'unidirectional', 'bidirectional', 'omniscient', 'omnipotent', 'ubiquitous', 'perspicacious',
  'Byzantine', 'Machiavellian', 'Herculean', 'Kafkaesque', 'Shakespearean', 'Orwellian', 'Draconian', 'Platonic', 'Socratic', 'Aristotelian'
];

/**
 * Generate random words based on difficulty level
 * Returns a string of words separated by spaces
 */
function generateRandomWords(difficulty = 'intermediate', wordCountOverride = null) {
  let wordsList;
  let wordCount;

  // Adjust word count based on difficulty level
  switch (difficulty) {
    case 'beginner':
      wordsList = beginnerWords;
      wordCount = 50 + Math.floor(Math.random() * 20); // 50-70 words
      break;
    case 'intermediate':
      wordsList = intermediateWords;
      wordCount = 75 + Math.floor(Math.random() * 25); // 75-100 words
      break;
    case 'advanced':
      wordsList = advancedWords;
      wordCount = 100 + Math.floor(Math.random() * 30); // 100-130 words
      break;
    default:
      wordsList = intermediateWords;
      wordCount = 75;
  }

  // Override word count if provided
  if (wordCountOverride !== null && wordCountOverride > 0) {
    wordCount = wordCountOverride;
  }

  const words = [];
  for (let i = 0; i < wordCount; i++) {
    const randomIndex = Math.floor(Math.random() * wordsList.length);
    words.push(wordsList[randomIndex]);
  }

  return words.join(' ');
}

/**
 * Get preview of random words (first 100 characters)
 */
function getRandomWordsPreview(difficulty = 'intermediate') {
  const text = generateRandomWords(difficulty);
  return text.substring(0, 100) + (text.length > 100 ? '...' : '');
}

export default {
  generateRandomWords,
  getRandomWordsPreview,
  beginnerWords,
  intermediateWords,
  advancedWords,
};
