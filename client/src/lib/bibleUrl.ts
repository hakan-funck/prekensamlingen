// Mapping from Norwegian book names to bible.com abbreviations
const NORWEGIAN_TO_BIBLE_COM: Record<string, string> = {
  // Old Testament
  '1Mos': 'GEN',
  '2Mos': 'EXO',
  '3Mos': 'LEV',
  '4Mos': 'NUM',
  '5Mos': 'DEU',
  'Jos': 'JOS',
  'Dom': 'JDG',
  'Rut': 'RUT',
  '1Sam': '1SA',
  '2Sam': '2SA',
  '1Kong': '1KI',
  '2Kong': '2KI',
  '1Krøn': '1CH',
  '2Krøn': '2CH',
  'Esra': 'EZR',
  'Neh': 'NEH',
  'Est': 'EST',
  'Job': 'JOB',
  'Sal': 'PSA',
  'Ord': 'PRO',
  'Fork': 'ECC',
  'Høys': 'SNG',
  'Jes': 'ISA',
  'Jer': 'JER',
  'Klages': 'LAM',
  'Esek': 'EZK',
  'Dan': 'DAN',
  'Hos': 'HOS',
  'Joel': 'JOL',
  'Amos': 'AMO',
  'Obad': 'OBA',
  'Jona': 'JON',
  'Mika': 'MIC',
  'Nah': 'NAM',
  'Hab': 'HAB',
  'Sef': 'ZEP',
  'Hagg': 'HAG',
  'Sak': 'ZEC',
  'Mal': 'MAL',
  
  // New Testament
  'Matt': 'MAT',
  'Mark': 'MRK',
  'Luk': 'LUK',
  'Joh': 'JHN',
  'Apg': 'ACT',
  'Rom': 'ROM',
  '1Kor': '1CO',
  '2Kor': '2CO',
  'Gal': 'GAL',
  'Ef': 'EPH',
  'Fil': 'PHP',
  'Kol': 'COL',
  '1Tess': '1TH',
  '2Tess': '2TH',
  '1Tim': '1TI',
  '2Tim': '2TI',
  'Tit': 'TIT',
  'Filem': 'PHM',
  'Hebr': 'HEB',
  'Jak': 'JAS',
  '1Pet': '1PE',
  '2Pet': '2PE',
  '1Joh': '1JN',
  '2Joh': '2JN',
  '3Joh': '3JN',
  'Jud': 'JUD',
  'Åp': 'REV'
};

/**
 * Generate a bible.com URL for the given Bible reference
 * @param bibleBook Norwegian book name (e.g., "Matt", "1Mos")
 * @param bibleChapter Chapter number (e.g., "3", "17")
 * @param bibleVerses Verse range (e.g., "13-17", "5", "7-15")
 * @returns URL to bible.com with the specific passage
 */
export function generateBibleUrl(
  bibleBook: string, 
  bibleChapter: string, 
  bibleVerses: string
): string {
  // Get bible.com abbreviation
  const bookAbbrev = NORWEGIAN_TO_BIBLE_COM[bibleBook];
  if (!bookAbbrev) {
    // Fallback to a general bible.com search if book not found
    return `https://www.bible.com/search/bible?q=${encodeURIComponent(`${bibleBook} ${bibleChapter}:${bibleVerses}`)}`;
  }

  // Clean up verses - remove spaces and handle different formats
  const cleanVerses = bibleVerses.replace(/\s+/g, '').replace(/,/g, '-');
  
  // Construct URL: https://www.bible.com/no/bible/121/MAT.3.13-17.BIBEL1930
  const url = `https://www.bible.com/no/bible/121/${bookAbbrev}.${bibleChapter}.${cleanVerses}.BIBEL1930`;
  
  return url;
}

/**
 * Generate a bible.com URL from a full Bible reference string
 * @param bibleBook Norwegian book name
 * @param bibleChapter Chapter number
 * @param bibleVerses Verse range
 * @returns URL to bible.com or null if invalid
 */
export function generateBibleUrlFromReference(
  bibleBook: string,
  bibleChapter: string, 
  bibleVerses: string
): string | null {
  if (!bibleBook || !bibleChapter || !bibleVerses) {
    return null;
  }

  try {
    return generateBibleUrl(bibleBook, bibleChapter, bibleVerses);
  } catch (error) {
    console.warn('Error generating Bible URL:', error);
    return null;
  }
}