/**
 * Track subsystems, message counts, and search matches
 */

class StatsTracker {
  constructor() {
    // Map: source -> subsystem -> stats object
    this.stats = new Map();

    // Set of all known subsystem keys (source:subsystem)
    this.knownSubsystems = new Set();

    // Set of all sender IPs that have ever sent messages
    this.allSenderIPs = new Set();

    // Total message count
    this.totalMessages = 0;
  }

  /**
   * Track a message
   * @param {Object} parsedMessage - Parsed message object
   * @param {Array<string>} matchingTerms - Search terms that matched
   * @returns {boolean} True if this is a new subsystem
   */
  trackMessage(parsedMessage, matchingTerms = []) {
    const { source, subsystem, senderIp } = parsedMessage;

    if (!source || !subsystem) {
      return false;
    }

    // Track this sender IP
    if (senderIp) {
      this.allSenderIPs.add(senderIp);
    }

    const subsystemKey = `${source}:${subsystem}`;
    const isNewSubsystem = !this.knownSubsystems.has(subsystemKey);

    if (isNewSubsystem) {
      this.knownSubsystems.add(subsystemKey);
    }

    // Initialize source map if needed
    if (!this.stats.has(source)) {
      this.stats.set(source, new Map());
    }

    const sourceStats = this.stats.get(source);

    // Initialize subsystem stats if needed
    if (!sourceStats.has(subsystem)) {
      sourceStats.set(subsystem, {
        count: 0,
        senderIp: senderIp,
        searchMatches: new Set(),
      });
    }

    const subsystemStats = sourceStats.get(subsystem);
    subsystemStats.count++;

    // Update sender IP to the most recent one
    subsystemStats.senderIp = senderIp;

    // Track search matches
    for (const term of matchingTerms) {
      subsystemStats.searchMatches.add(term);
    }

    this.totalMessages++;

    return isNewSubsystem;
  }

  /**
   * Get all stats in a flat array format for display
   * @returns {Array<Object>} Array of stat objects
   */
  getAllStats() {
    const statsArray = [];

    for (const [source, subsystems] of this.stats.entries()) {
      for (const [subsystem, stats] of subsystems.entries()) {
        statsArray.push({
          source,
          subsystem,
          count: stats.count,
          senderIp: stats.senderIp,
          searchMatches: Array.from(stats.searchMatches).sort(),
        });
      }
    }

    // Sort by source, then subsystem
    statsArray.sort((a, b) => {
      if (a.source !== b.source) {
        return a.source.localeCompare(b.source);
      }
      return a.subsystem.localeCompare(b.subsystem);
    });

    return statsArray;
  }

  /**
   * Get total message count
   * @returns {number} Total messages processed
   */
  getTotalMessages() {
    return this.totalMessages;
  }

  /**
   * Get number of unique subsystems
   * @returns {number} Number of unique subsystems
   */
  getUniqueSubsystemCount() {
    return this.knownSubsystems.size;
  }

  /**
   * Get all unique sender IPs
   * @returns {Array<string>} Sorted array of all sender IPs
   */
  getAllSenderIPs() {
    return Array.from(this.allSenderIPs).sort();
  }

  /**
   * Reset all counters
   */
  reset() {
    this.stats.clear();
    this.knownSubsystems.clear();
    this.allSenderIPs.clear();
    this.totalMessages = 0;
  }

  /**
   * Export current stats to JSON
   * @returns {Object} Stats in JSON format
   */
  exportToJSON() {
    return {
      totalMessages: this.totalMessages,
      uniqueSubsystems: this.knownSubsystems.size,
      timestamp: new Date().toISOString(),
      stats: this.getAllStats(),
    };
  }
}

module.exports = StatsTracker;
