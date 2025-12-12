/**
 * Manage dynamic search terms for filtering log messages
 */

class SearchManager {
  constructor() {
    this.searchTerms = new Set();
    this.matchCounts = new Map(); // term -> count
  }

  /**
   * Add a search term
   * @param {string} term - Search term to add
   * @returns {boolean} True if added, false if already exists
   */
  addTerm(term) {
    if (!term || term.trim() === '') {
      return false;
    }
    
    const normalizedTerm = term.trim().toLowerCase();
    if (this.searchTerms.has(normalizedTerm)) {
      return false;
    }
    
    this.searchTerms.add(normalizedTerm);
    this.matchCounts.set(normalizedTerm, 0);
    return true;
  }

  /**
   * Remove a search term
   * @param {string} term - Search term to remove
   * @returns {boolean} True if removed, false if not found
   */
  removeTerm(term) {
    const normalizedTerm = term.trim().toLowerCase();
    if (!this.searchTerms.has(normalizedTerm)) {
      return false;
    }
    
    this.searchTerms.delete(normalizedTerm);
    this.matchCounts.delete(normalizedTerm);
    return true;
  }

  /**
   * Clear all search terms
   */
  clearTerms() {
    this.searchTerms.clear();
    this.matchCounts.clear();
  }

  /**
   * Get all active search terms
   * @returns {Array<string>} Array of search terms
   */
  getTerms() {
    return Array.from(this.searchTerms);
  }

  /**
   * Check if a message matches any search terms
   * @param {string} message - Message to search
   * @returns {Array<string>} Array of matching terms
   */
  findMatches(message) {
    if (!message) {
      return [];
    }
    
    const normalizedMessage = message.toLowerCase();
    const matches = [];
    
    for (const term of this.searchTerms) {
      if (normalizedMessage.includes(term)) {
        matches.push(term);
        this.matchCounts.set(term, (this.matchCounts.get(term) || 0) + 1);
      }
    }
    
    return matches;
  }

  /**
   * Get match count for a term
   * @param {string} term - Search term
   * @returns {number} Number of matches
   */
  getMatchCount(term) {
    return this.matchCounts.get(term.toLowerCase()) || 0;
  }

  /**
   * Get total number of active search terms
   * @returns {number} Number of active search terms
   */
  getTermCount() {
    return this.searchTerms.size;
  }
}

export default SearchManager;
