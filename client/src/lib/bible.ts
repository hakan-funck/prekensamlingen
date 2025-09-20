// Biblical order of books using Norwegian abbreviations
// Based on the Norwegian Bible structure (Old Testament first, then New Testament)
export const BIBLICAL_ORDER = [
  // Old Testament
  '1Mos', '2Mos', '3Mos', '4Mos', '5Mos',
  'Jos', 'Dom', 'Rut', '1Sam', '2Sam', '1Kong', '2Kong',
  '1Krøn', '2Krøn', 'Esra', 'Neh', 'Est', 'Job', 'Sal', 'Ord', 'Fork',
  'Høys', 'Jes', 'Jer', 'Klages', 'Esek', 'Dan', 'Hos', 'Joel', 'Amos',
  'Obad', 'Jona', 'Mika', 'Nah', 'Hab', 'Sef', 'Hagg', 'Sak', 'Mal',
  
  // New Testament
  'Matt', 'Mark', 'Luk', 'Joh', 'Apg', 'Rom', '1Kor', '2Kor', 'Gal',
  'Ef', 'Fil', 'Kol', '1Tess', '2Tess', '1Tim', '2Tim', 'Tit', 'Filem',
  'Hebr', 'Jak', '1Pet', '2Pet', '1Joh', '2Joh', '3Joh', 'Jud', 'Åp'
] as const;

/**
 * Sort Bible books in Biblical order
 */
export function sortBooksInBiblicalOrder(books: string[]): string[] {
  return books.sort((a, b) => {
    const indexA = BIBLICAL_ORDER.indexOf(a as any);
    const indexB = BIBLICAL_ORDER.indexOf(b as any);
    
    // If book not found in order, put it at the end
    if (indexA === -1 && indexB === -1) return a.localeCompare(b);
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    
    return indexA - indexB;
  });
}