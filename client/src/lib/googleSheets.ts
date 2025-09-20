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

// Convert Google Drive sharing URL to use our backend proxy
export function convertGoogleDriveUrl(shareUrl: string): string {
  if (!shareUrl || shareUrl.trim() === '' || shareUrl === '-') {
    return '#';
  }
  
  console.log('Converting Google Drive URL:', shareUrl);
  
  // Extract file ID from Google Drive share URL
  const fileIdMatch = shareUrl.match(/\/file\/d\/([a-zA-Z0-9-_]+)/);
  if (fileIdMatch) {
    const fileId = fileIdMatch[1];
    
    // Use our backend proxy to stream the audio file
    const proxyUrl = `/api/audio/${fileId}`;
    console.log('Converted to proxy URL:', proxyUrl);
    return proxyUrl;
  }
  
  // If it's already a direct URL or not a Google Drive URL, return as-is
  console.log('Using original URL:', shareUrl);
  return shareUrl;
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
  if (index < 4 || !row || row.length < 12) {
    return null;
  }
  
  // New column mapping with Audio URL in column B
  return {
    speaker: row[0]?.trim() || '', // A: Speaker
    audioUrl: convertGoogleDriveUrl(row[1]?.trim() || ''), // B: Audio URL
    date: row[2]?.trim() || '', // C: Date (was B)
    bibleBook: row[3]?.trim() || '', // D: Bible Book (was C)
    bibleChapter: row[4]?.trim() || '', // E: Bible Chapter (was D)
    bibleVerses: row[5]?.trim() || '', // F: Bible Verses (was E)
    språk: convertLanguageToCode(row[6]?.trim() || ''), // G: Language (was F)
    tolk: row[7]?.trim() || '-', // H: Interpreter (was G)
    tolkTilSpråk: convertLanguageToCode(row[8]?.trim() || ''), // I: Interpreter Lang (was H)
    duration: row[9]?.trim() || '', // J: Duration (was I)
    sted: row[10]?.trim() || '', // K: Location (was J)
    kilde: row[11]?.trim() || '', // L: Source (was K)
    annenInfo: row[12]?.trim() || undefined, // M: Additional Info (was L)
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
    throw error;
  }
}