import type { Sermon } from '@/components/SermonCard';

// Re-export the Sermon type for convenience in other files that import this utility
export type { Sermon };

/**
 * Generate a shareable URL for a specific sermon
 * @param sermon The sermon to share
 * @returns URL with sermon parameters
 */
export function generateSermonShareUrl(sermon: Sermon): string {
  const baseUrl = window.location.origin + window.location.pathname;
  const params = new URLSearchParams();
  
  // Use sermon ID as primary identifier, but add fallback matching data
  params.set('sermon', sermon.id);
  params.set('speaker', sermon.speaker);
  if (sermon.date) {
    params.set('date', sermon.date);
  }
  // Add Bible reference for additional matching
  if (sermon.bibleBook && sermon.bibleChapter) {
    params.set('reference', `${sermon.bibleBook} ${sermon.bibleChapter}:${sermon.bibleVerses}`);
  }
  
  return `${baseUrl}?${params.toString()}`;
}

/**
 * Copy text to clipboard using modern clipboard API with fallback
 * @param text Text to copy
 * @returns Promise that resolves when copy is successful
 */
export async function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard && window.isSecureContext) {
    // Use modern clipboard API
    await navigator.clipboard.writeText(text);
  } else {
    // Fallback for older browsers or insecure contexts
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      document.execCommand('copy');
    } finally {
      document.body.removeChild(textArea);
    }
  }
}

/**
 * Parse URL parameters to get sermon information
 * @returns Object with sermon parameters or null if no sermon in URL
 */
export function parseSermonFromUrl(): { 
  sermonId?: string; 
  speaker?: string; 
  date?: string;
  reference?: string;
} | null {
  const params = new URLSearchParams(window.location.search);
  const sermonId = params.get('sermon');
  
  if (!sermonId) {
    return null;
  }
  
  return {
    sermonId,
    speaker: params.get('speaker') || undefined,
    date: params.get('date') || undefined,
    reference: params.get('reference') || undefined
  };
}

/**
 * Find sermon by various criteria (with fallback matching)
 * @param sermons Array of sermons to search
 * @param criteria Search criteria from shared URL
 * @returns Found sermon or null
 */
export function findSermonFromCriteria(
  sermons: Sermon[], 
  criteria: { sermonId?: string; speaker?: string; date?: string; reference?: string }
): Sermon | null {
  if (!criteria.sermonId) return null;
  
  // First try exact ID match, but validate against other criteria if provided
  let sermon = sermons.find(s => s.id === criteria.sermonId);
  if (sermon) {
    // Validate the ID match against other provided criteria
    let isValid = true;
    
    if (criteria.speaker && !sermon.speaker.toLowerCase().includes(criteria.speaker.toLowerCase())) {
      isValid = false;
    }
    
    if (criteria.date && sermon.date !== criteria.date) {
      isValid = false;
    }
    
    if (criteria.reference) {
      const sermonRef = `${sermon.bibleBook} ${sermon.bibleChapter}:${sermon.bibleVerses}`;
      if (sermonRef !== criteria.reference) {
        isValid = false;
      }
    }
    
    if (isValid) return sermon;
    // If ID match is invalid, fall through to fallback matching
  }
  
  // Fallback: match by speaker and date/reference
  if (criteria.speaker) {
    const candidatesByName = sermons.filter(s => 
      s.speaker.toLowerCase().includes(criteria.speaker!.toLowerCase())
    );
    
    if (candidatesByName.length === 1) {
      return candidatesByName[0];
    }
    
    // If multiple matches, try to narrow by date or reference
    if (candidatesByName.length > 1) {
      if (criteria.date) {
        sermon = candidatesByName.find(s => s.date === criteria.date);
        if (sermon) return sermon;
      }
      
      if (criteria.reference) {
        sermon = candidatesByName.find(s => 
          `${s.bibleBook} ${s.bibleChapter}:${s.bibleVerses}` === criteria.reference
        );
        if (sermon) return sermon;
      }
    }
  }
  
  return null;
}