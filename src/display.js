/**
 * Display statistics in text-based tables
 */

const Table = require('cli-table3');
const chalk = require('chalk');

class Display {
  constructor(config) {
    this.config = config;
  }

  /**
   * Display statistics table
   * @param {Array<Object>} stats - Stats array from StatsTracker
   * @param {number} totalMessages - Total message count
   * @param {number} activeSearchTerms - Number of active search terms
   * @param {number} uniqueSubsystems - Number of unique subsystems
   */
  showStatsTable(stats, totalMessages, activeSearchTerms, uniqueSubsystems) {
    if (stats.length === 0) {
      console.log(chalk.yellow('\nNo data collected yet. Waiting for UDP messages...\n'));
      return;
    }

    const table = new Table({
      head: [
        chalk.cyan('Source'),
        chalk.cyan('Subsystem'),
        chalk.cyan('Count'),
        chalk.cyan('Sender IP'),
        chalk.cyan('Search Matches')
      ],
      colWidths: [20, 35, 10, 18, 25]
    });

    for (const stat of stats) {
      table.push([
        stat.source,
        stat.subsystem,
        stat.count.toString(),
        stat.senderIp,
        stat.searchMatches.join(', ')
      ]);
    }

    console.clear();
    console.log(chalk.bold('\n=== Qlik Sense Log Scanner - Statistics ===\n'));
    console.log(table.toString());
    console.log(
      chalk.green(
        `\nTotal messages: ${totalMessages} | ` +
        `Active search terms: ${activeSearchTerms} | ` +
        `Unique subsystems: ${uniqueSubsystems}\n`
      )
    );
  }

  /**
   * Display new subsystem discovery
   * @param {string} source - Source name
   * @param {string} subsystem - Subsystem name
   * @param {Array<Object>} allStats - All current stats
   */
  showNewSubsystemDiscovery(source, subsystem, allStats) {
    const timestamp = new Date().toLocaleString();
    console.log(
      chalk.green.bold(
        `\n[${timestamp}] NEW SUBSYSTEM DISCOVERED: ${source} -> ${subsystem}\n`
      )
    );
    
    console.log(chalk.bold('=== All Known Subsystems (sorted) ===\n'));
    
    const table = new Table({
      head: [
        chalk.cyan('Source'),
        chalk.cyan('Subsystem'),
        chalk.cyan('Count'),
        chalk.cyan('Sender IP'),
        chalk.cyan('Search Matches')
      ],
      colWidths: [20, 35, 10, 18, 25]
    });

    for (const stat of allStats) {
      table.push([
        stat.source,
        stat.subsystem,
        stat.count.toString(),
        stat.senderIp,
        stat.searchMatches.join(', ')
      ]);
    }

    console.log(table.toString());
    console.log();
  }

  /**
   * Display search match
   * @param {Object} parsedMessage - Parsed message
   * @param {Array<string>} matchingTerms - Matching search terms
   * @param {number} maxPreview - Max characters for message preview
   */
  showSearchMatch(parsedMessage, matchingTerms, maxPreview = 100) {
    const timestamp = new Date().toLocaleString();
    const preview = parsedMessage.messageContent.substring(0, maxPreview);
    const previewText = preview.length < parsedMessage.messageContent.length 
      ? `${preview}...` 
      : preview;

    console.log(
      chalk.yellow.bold(
        `\n[${timestamp}] SEARCH MATCH: ${matchingTerms.join(', ')}`
      )
    );
    console.log(chalk.white(`  Source: ${parsedMessage.source}`));
    console.log(chalk.white(`  Subsystem: ${parsedMessage.subsystem}`));
    console.log(chalk.white(`  Sender: ${parsedMessage.senderIp}`));
    console.log(chalk.white(`  Message: ${previewText}\n`));
  }

  /**
   * Display help text
   */
  showHelp() {
    console.log(chalk.bold('\n=== Qlik Sense Log Scanner ==='));
    console.log(chalk.cyan('\nCommands:'));
    console.log('  stats              - Show current statistics table');
    console.log('  add <term>         - Add a search term');
    console.log('  remove <term>      - Remove a search term');
    console.log('  list               - List all active search terms');
    console.log('  clear              - Clear all search terms');
    console.log('  export [filename]  - Export current data to JSON file');
    console.log('  reset              - Reset all counters');
    console.log('  help               - Show this help');
    console.log('  quit               - Exit the application');
    console.log();
  }

  /**
   * Show command prompt
   */
  showPrompt() {
    process.stdout.write(chalk.bold('\nEnter command: '));
  }
}

module.exports = Display;
