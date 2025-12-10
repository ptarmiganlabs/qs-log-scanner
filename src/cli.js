/**
 * Interactive command line interface
 */

const readline = require('readline');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

class CLI {
  constructor(searchManager, statsTracker, display, logger) {
    this.searchManager = searchManager;
    this.statsTracker = statsTracker;
    this.display = display;
    this.logger = logger;
    this.rl = null;
  }

  /**
   * Start the CLI
   */
  start() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: ''
    });

    this.display.showHelp();
    this.display.showPrompt();

    this.rl.on('line', (line) => {
      this.handleCommand(line.trim());
    });

    this.rl.on('close', () => {
      // Emit SIGINT to trigger graceful shutdown
      console.log(chalk.yellow('\nExiting...'));
      process.kill(process.pid, 'SIGINT');
    });
  }

  /**
   * Handle a command
   * @param {string} input - Command input
   */
  handleCommand(input) {
    if (!input) {
      this.display.showPrompt();
      return;
    }

    const parts = input.split(' ');
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

    switch (command) {
      case 'stats':
        this.showStats();
        break;

      case 'add':
        this.addSearchTerm(args.join(' '));
        break;

      case 'remove':
        this.removeSearchTerm(args.join(' '));
        break;

      case 'list':
        this.listSearchTerms();
        break;

      case 'clear':
        this.clearSearchTerms();
        break;

      case 'export':
        this.exportData(args[0]);
        break;

      case 'reset':
        this.resetCounters();
        break;

      case 'help':
        this.display.showHelp();
        break;

      case 'quit':
      case 'exit':
        this.rl.close();
        break;

      default:
        console.log(chalk.red(`Unknown command: ${command}`));
        console.log(chalk.yellow('Type "help" for available commands'));
        break;
    }

    this.display.showPrompt();
  }

  /**
   * Show current statistics
   */
  showStats() {
    const stats = this.statsTracker.getAllStats();
    const totalMessages = this.statsTracker.getTotalMessages();
    const activeSearchTerms = this.searchManager.getTermCount();
    const uniqueSubsystems = this.statsTracker.getUniqueSubsystemCount();

    this.display.showStatsTable(
      stats,
      totalMessages,
      activeSearchTerms,
      uniqueSubsystems
    );
  }

  /**
   * Add a search term
   * @param {string} term - Search term to add
   */
  addSearchTerm(term) {
    if (!term) {
      console.log(chalk.red('Error: Please provide a search term'));
      return;
    }

    const added = this.searchManager.addTerm(term);
    if (added) {
      console.log(chalk.green(`✓ Added search term: "${term}"`));
    } else {
      console.log(chalk.yellow(`Search term already exists: "${term}"`));
    }
  }

  /**
   * Remove a search term
   * @param {string} term - Search term to remove
   */
  removeSearchTerm(term) {
    if (!term) {
      console.log(chalk.red('Error: Please provide a search term'));
      return;
    }

    const removed = this.searchManager.removeTerm(term);
    if (removed) {
      console.log(chalk.green(`✓ Removed search term: "${term}"`));
    } else {
      console.log(chalk.yellow(`Search term not found: "${term}"`));
    }
  }

  /**
   * List all active search terms
   */
  listSearchTerms() {
    const terms = this.searchManager.getTerms();
    
    if (terms.length === 0) {
      console.log(chalk.yellow('\nNo active search terms'));
      return;
    }

    console.log(chalk.bold('\n=== Active Search Terms ===\n'));
    terms.forEach((term, index) => {
      const count = this.searchManager.getMatchCount(term);
      console.log(
        chalk.white(`  ${index + 1}. "${term}" - ${count} matches`)
      );
    });
    console.log();
  }

  /**
   * Clear all search terms
   */
  clearSearchTerms() {
    this.searchManager.clearTerms();
    console.log(chalk.green('✓ All search terms cleared'));
  }

  /**
   * Export data to JSON file
   * @param {string} filename - Optional filename
   */
  exportData(filename) {
    const defaultFilename = `qs-log-scanner-${Date.now()}.json`;
    const exportFilename = filename || defaultFilename;
    const exportPath = path.resolve(exportFilename);

    try {
      const data = this.statsTracker.exportToJSON();
      fs.writeFileSync(exportPath, JSON.stringify(data, null, 2));
      console.log(chalk.green(`✓ Data exported to: ${exportPath}`));
    } catch (error) {
      console.log(chalk.red(`Error exporting data: ${error.message}`));
      this.logger.error(`Export error: ${error.message}`);
    }
  }

  /**
   * Reset all counters
   */
  resetCounters() {
    this.statsTracker.reset();
    console.log(chalk.green('✓ All counters reset'));
  }

  /**
   * Stop the CLI
   */
  stop() {
    if (this.rl) {
      this.rl.close();
    }
  }
}

module.exports = CLI;
