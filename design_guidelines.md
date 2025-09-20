# Design Guidelines for Norwegian Sermon Browser

## Design Approach
**Reference-Based Approach** - Drawing inspiration from content-focused platforms like Spotify and YouTube for media browsing, with Notion-like organization for searchable content. This approach balances content discovery with clean information architecture.

## Core Design Elements

### A. Color Palette
**Light Mode:**
- Primary: 220 15% 20% (Deep navy blue for headers and navigation)
- Background: 0 0% 98% (Clean off-white)
- Content cards: 0 0% 100% (Pure white)
- Accent: 220 60% 50% (Medium blue for links and buttons)

**Dark Mode:**
- Primary: 220 15% 85% (Light gray for text)
- Background: 220 15% 8% (Deep navy background)
- Content cards: 220 10% 12% (Slightly lighter navy for cards)
- Accent: 220 60% 60% (Brighter blue for contrast)

### B. Typography
- **Primary:** Inter via Google Fonts (clean, readable for Norwegian text)
- **Secondary:** Georgia for sermon titles (adds warmth and readability)
- Hierarchy: 2xl for page headers, xl for section titles, base for body text

### C. Layout System
**Tailwind spacing units: 2, 4, 6, 8, 12, 16**
- Consistent 8-unit spacing for major sections
- 4-unit spacing for related elements
- 2-unit spacing for tight groupings

### D. Component Library

**Navigation:**
- Clean header with logo/title in Norwegian
- Search bar prominently featured
- Filter toggles for speakers, dates, bible texts

**Content Display:**
- Card-based layout for sermon listings
- Each card shows: title, speaker, date, bible reference, duration
- Grid view (3-4 columns desktop, 1-2 mobile)
- List view option for detailed scanning

**Audio Player:**
- Sticky bottom player when sermon is selected
- Standard controls: play/pause, progress bar, volume
- Current sermon title and speaker display
- Mini-player mode for continued browsing

**Search & Filters:**
- Prominent search input with Norwegian placeholder text
- Filter sidebar/dropdown with categories:
  - Taler (Speaker)
  - Bibeltekst (Bible Text)
  - Dato (Date)
  - Emne (Topic)
- Clear filter states and active indicators

**Data Display:**
- Clean typography hierarchy for sermon metadata
- Subtle dividers between information sections
- Consistent spacing for scannable content

### E. Norwegian Language Considerations
- All interface text in Norwegian (buttons, labels, placeholders)
- Proper Norwegian typography spacing
- Cultural appropriate iconography and visual metaphors
- Consider Norwegian reading patterns in layout flow

## Key Design Principles
1. **Content-First:** Sermon discovery and access is the primary goal
2. **Clean Information Architecture:** Easy scanning and filtering of large sermon collections
3. **Audio-Focused UX:** Seamless listening experience with background browsing
4. **Norwegian Cultural Context:** Appropriate tone and language for religious content
5. **Performance-Minded:** Fast loading for large sermon databases

## Images
**No hero image needed** - This is a utility-focused application where content discovery takes precedence. Focus visual attention on:
- Sermon thumbnails/artwork (if available from metadata)
- Speaker photos (optional, from spreadsheet data)
- Simple iconography for play states and categories
- Norwegian-appropriate religious symbols if contextually relevant

The design should feel trustworthy, organized, and focused on easy access to spiritual content rather than marketing appeal.