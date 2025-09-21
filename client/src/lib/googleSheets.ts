// Google Sheets CSV integration utilities

export interface RawSermonData {
  speaker: string;
  audioUrl: string;
  date: string;
  bibleBook: string;
  bibleChapter: string;
  bibleVerses: string;
  språk: string;
  tolk: string;
  tolkTilSpråk: string;
  duration: string;
  sted: string;
  kilde: string;
  annenInfo?: string;
}

// Normalize audio URL to use our backend proxy (handles Google Drive URLs, R2 filenames, and direct URLs)
export function convertGoogleDriveUrl(audioValue: string): string {
  if (!audioValue || audioValue.trim() === '' || audioValue === '-') {
    return '#';
  }
  
  const trimmed = audioValue.trim();
  
  // Handle Google Drive share URLs
  const fileIdMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9-_]+)/);
  if (fileIdMatch) {
    const fileId = fileIdMatch[1];
    return `/api/audio/${fileId}`;
  }
  
  // Handle bare Google Drive IDs (28-33 characters, alphanumeric with dashes/underscores)
  if (/^[a-zA-Z0-9_-]{28,33}$/.test(trimmed)) {
    return `/api/audio/${trimmed}`;
  }
  
  // Handle R2 filenames (ends with .mp3 and doesn't start with http//)
  if (trimmed.endsWith('.mp3') && !trimmed.startsWith('http') && !trimmed.startsWith('/')) {
    return `/api/audio/sermons/${trimmed}`;
  }
  
  // If it already starts with /api/audio/, return as-is
  if (trimmed.startsWith('/api/audio/')) {
    return trimmed;
  }
  
  // If it's already a full URL or proxy path, return as-is
  return trimmed;
}

// Extract book from "Book Chapter" format (e.g., "Joh 16" -> "Joh", "1 Mos 50" -> "1Mos")
function extractBookFromReference(bookChapter: string): string {
  if (!bookChapter) return '';
  
  const trimmed = bookChapter.trim();
  
  // Handle numbered books: "1 Mos 50", "1Mos 50", "1. Mos 50", "3 Joh 1", etc.
  const numberedMatch = trimmed.match(/^(\d+)\s*\.?\s*([A-Za-zÆØÅæøå]+)/);
  if (numberedMatch) {
    return numberedMatch[1] + numberedMatch[2]; // e.g., "1" + "Mos" = "1Mos"
  }
  
  // Handle regular books: "Joh 16", "Matt 5", "Matt. 5", "Åp 1", etc.
  const regularMatch = trimmed.match(/^([A-Za-zÆØÅæøå]+)/);
  if (regularMatch) {
    return regularMatch[1]; // e.g., "Joh", "Matt", "Åp"
  }
  
  return trimmed;
}

// Extract chapter from "Book Chapter" format (e.g., "Joh 16" -> "16")
function extractChapterFromReference(bookChapter: string): string {
  if (!bookChapter) return '';
  const match = bookChapter.match(/([\d,\-]+)\s*$/);
  return match ? match[1].trim() : '';
}

// Convert language name to code
export function convertLanguageToCode(lang: string): 'fi' | 'sv' | 'no' | 'en' | '-' {
  if (!lang || lang.trim() === '' || lang === '-') return '-';
  
  const normalized = lang.toLowerCase().trim();
  switch (normalized) {
    case 'finsk':
    case 'finnish':
    case 'fi':
      return 'fi';
    case 'svensk':
    case 'swedish':
    case 'sv':
      return 'sv';
    case 'norsk':
    case 'norwegian':
    case 'no':
      return 'no';
    case 'engelsk':
    case 'english':
    case 'en':
      return 'en';
    default:
      return 'no'; // Default to Norwegian
  }
}

// Parse CSV row to sermon data
export function parseSermonRow(row: string[], index: number): RawSermonData | null {
  // Skip first 4 rows (header/metadata) and empty rows - data starts from row 5 (index 4)
  if (index < 4 || !row || row.length < 10) {
    return null;
  }
  
  // CSV parsing successful - data starts from row 5
  
  // Corrected column mapping after adding Audio URL in column B
  return {
    speaker: row[0]?.trim() || '', // A: Speaker
    audioUrl: convertGoogleDriveUrl(row[1]?.trim() || ''), // B: Audio URL
    date: row[2]?.trim() || '', // C: Date
    bibleBook: extractBookFromReference(row[3]?.trim() || ''), // D: Extract book from "Joh 16"
    bibleChapter: extractChapterFromReference(row[3]?.trim() || ''), // D: Extract chapter from "Joh 16"
    bibleVerses: row[4]?.trim() || '', // E: Bible verses (e.g., "7-15")
    språk: convertLanguageToCode(row[5]?.trim() || ''), // F: Language of sermon
    tolk: row[6]?.trim() || '-', // G: Interpreter
    tolkTilSpråk: convertLanguageToCode(row[7]?.trim() || ''), // H: Language of interpreter
    duration: row[8]?.trim() || '', // I: Length of sermon
    sted: row[9]?.trim() || '', // J: Location
    kilde: row[11]?.trim() || '', // L: Source
    annenInfo: row[12]?.trim() || undefined, // M: Additional information
  };
}

// Fetch and parse Google Sheets CSV
export async function fetchSermonsFromSheet(spreadsheetId: string, limit?: number): Promise<RawSermonData[]> {
  const csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv`;
  
  try {
    const response = await fetch(csvUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch spreadsheet: ${response.status}`);
    }
    
    const csvText = await response.text();
    const rows = csvText.split('\n').map(row => {
      // Simple CSV parsing - handle quotes and commas
      const fields: string[] = [];
      let currentField = '';
      let inQuotes = false;
      
      for (let i = 0; i < row.length; i++) {
        const char = row[i];
        const nextChar = row[i + 1];
        
        if (char === '"' && !inQuotes) {
          inQuotes = true;
        } else if (char === '"' && inQuotes) {
          if (nextChar === '"') {
            currentField += '"';
            i++; // Skip next quote
          } else {
            inQuotes = false;
          }
        } else if (char === ',' && !inQuotes) {
          fields.push(currentField);
          currentField = '';
        } else {
          currentField += char;
        }
      }
      fields.push(currentField); // Add last field
      
      return fields;
    });
    
    const sermons = rows
      .map((row, index) => parseSermonRow(row, index))
      .filter((sermon): sermon is RawSermonData => sermon !== null);
    
    return limit ? sermons.slice(0, limit) : sermons;
  } catch (error) {
    console.error('Error fetching sermons from sheet:', error);
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    throw error;
  }
}