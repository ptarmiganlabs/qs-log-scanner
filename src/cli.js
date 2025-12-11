/**
 * Interactive command line interface
 */

const readline = require("readline");
const fs = require("fs");
const path = require("path");
const chalk = require("chalk");

class CLI {
  constructor(searchManager, statsTracker, display, logger, config) {
    this.searchManager = searchManager;
    this.statsTracker = statsTracker;
    this.display = display;
    this.logger = logger;
    this.config = config;
    this.rl = null;
    this.autoRefreshTimer = null;
    this.helpVisible = false;
    this.currentSortColumn = "source"; // source, subsystem, count, ip
    this.sortAscending = true;
  }

  /**
   * Start the CLI
   */
  start() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: "",
    });

    this.display.showHelp();
    this.display.showPrompt();

    // Start auto-refresh if enabled
    if (this.config?.display?.autoRefresh) {
      this.startAutoRefresh();
    }

    this.rl.on("line", (line) => {
      this.handleCommand(line.trim());
    });

    this.rl.on("close", () => {
      // Emit SIGINT to trigger graceful shutdown
      console.log(chalk.yellow("\nExiting..."));
      process.kill(process.pid, "SIGINT");
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

    const parts = input.split(" ");
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

    switch (command) {
      case "1":
      case "s":
      case "stats":
        this.helpVisible = false;
        this.showStats();
        break;

      case "2":
      case "a":
      case "add":
        this.helpVisible = false;
        this.addSearchTerm(args.join(" "));
        break;

      case "3":
      case "r":
      case "remove":
        this.helpVisible = false;
        this.removeSearchTerm(args.join(" "));
        break;

      case "4":
      case "l":
      case "list":
        this.helpVisible = false;
        this.listSearchTerms();
        break;

      case "5":
      case "c":
      case "clear":
        this.helpVisible = false;
        this.clearSearchTerms();
        break;

      case "6":
      case "e":
      case "export":
        this.helpVisible = false;
        this.exportData(args[0]);
        break;

      case "csv":
        this.helpVisible = false;
        this.exportCSV(args[0]);
        break;

      case "auto":
        this.helpVisible = false;
        this.toggleAutoRefresh();
        break;

      case "sort":
        this.helpVisible = false;
        this.changeSortColumn(args[0]);
        break;

      case "7":
      case "x":
      case "reset":
        this.helpVisible = false;
        this.resetCounters();
        break;

      case "8":
      case "i":
      case "ip":
        this.helpVisible = false;
        this.showLocalIPs();
        break;

      case "9":
      case "h":
      case "help":
        this.helpVisible = true;
        this.display.showHelp();
        break;

      case "10":
      case "q":
      case "quit":
      case "exit":
        this.rl.close();
        break;

      default:
        this.helpVisible = false;
        console.log(chalk.red(`Unknown command: ${command}`));
        console.log(chalk.yellow('Type "h" or "help" for available commands'));
        break;
    }

    this.display.showPrompt();
  }

  /**
   * Show current statistics
   */
  showStats() {
    let stats = this.statsTracker.getAllStats();
    const totalMessages = this.statsTracker.getTotalMessages();
    const activeSearchTerms = this.searchManager.getTermCount();
    const uniqueSubsystems = this.statsTracker.getUniqueSubsystemCount();
    const allSenderIPs = this.statsTracker.getAllSenderIPs();

    // Sort stats based on current sort settings
    stats = this.sortStats(stats);

    this.display.showStatsTable(
      stats,
      totalMessages,
      activeSearchTerms,
      uniqueSubsystems,
      allSenderIPs,
      this.currentSortColumn,
      this.sortAscending
    );
  }

  /**
   * Add a search term
   * @param {string} term - Search term to add
   */
  addSearchTerm(term) {
    if (!term) {
      console.log(chalk.red("Error: Please provide a search term"));
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
      console.log(chalk.red("Error: Please provide a search term"));
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
      console.log(chalk.yellow("\nNo active search terms"));
      return;
    }

    console.log(chalk.bold("\n=== Active Search Terms ===\n"));
    terms.forEach((term, index) => {
      const count = this.searchManager.getMatchCount(term);
      console.log(chalk.white(`  ${index + 1}. "${term}" - ${count} matches`));
    });
    console.log();
  }

  /**
   * Clear all search terms
   */
  clearSearchTerms() {
    this.searchManager.clearTerms();
    console.log(chalk.green("✓ All search terms cleared"));
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
   * Export data to CSV file
   * @param {string} filename - Optional filename
   */
  exportCSV(filename) {
    const defaultFilename = `qs-log-scanner-${Date.now()}.csv`;
    const exportFilename = filename || defaultFilename;
    const exportPath = path.resolve(exportFilename);

    try {
      const stats = this.statsTracker.getAllStats();

      if (stats.length === 0) {
        console.log(chalk.yellow("No data to export"));
        return;
      }

      // CSV header
      const header = "Source,Subsystem,Count,Sender IP,Search Matches";

      // CSV rows
      const rows = stats.map((stat) => {
        // Escape fields that might contain commas or quotes
        const escapeField = (field) => {
          if (
            field.includes(",") ||
            field.includes('"') ||
            field.includes("\n")
          ) {
            return `"${field.replace(/"/g, '""')}"`;
          }
          return field;
        };

        return [
          escapeField(stat.source),
          escapeField(stat.subsystem),
          stat.count,
          stat.senderIp,
          escapeField(stat.searchMatches.join("; ")),
        ].join(",");
      });

      const csvContent = [header, ...rows].join("\n");
      fs.writeFileSync(exportPath, csvContent);
      console.log(chalk.green(`✓ Data exported to CSV: ${exportPath}`));
    } catch (error) {
      console.log(chalk.red(`Error exporting CSV: ${error.message}`));
      this.logger.error(`CSV export error: ${error.message}`);
    }
  }

  /**
   * Toggle auto-refresh
   */
  toggleAutoRefresh() {
    if (this.autoRefreshTimer) {
      this.stopAutoRefresh();
      console.log(chalk.yellow("✓ Auto-refresh disabled"));
    } else {
      this.startAutoRefresh();
      const interval = this.config?.display?.autoRefreshInterval || 5000;
      console.log(
        chalk.green(`✓ Auto-refresh enabled (every ${interval / 1000}s)`)
      );
    }
  }

  /**
   * Change sort column
   * @param {string} column - Column to sort by
   */
  changeSortColumn(column) {
    const validColumns = ["source", "subsystem", "count", "ip"];

    if (!column) {
      console.log(chalk.cyan("\nSort options: source, subsystem, count, ip"));
      console.log(
        chalk.white(
          `Current sort: ${this.currentSortColumn} (${
            this.sortAscending ? "ascending" : "descending"
          })`
        )
      );
      console.log(
        chalk.white(
          "Usage: sort <column> - toggles ascending/descending if same column"
        )
      );
      return;
    }

    const col = column.toLowerCase();
    if (!validColumns.includes(col)) {
      console.log(chalk.red(`Invalid column: ${column}`));
      console.log(chalk.yellow(`Valid columns: ${validColumns.join(", ")}`));
      return;
    }

    // If same column, toggle direction
    if (col === this.currentSortColumn) {
      this.sortAscending = !this.sortAscending;
    } else {
      this.currentSortColumn = col;
      this.sortAscending = true;
    }

    console.log(
      chalk.green(
        `✓ Sorting by ${this.currentSortColumn} (${
          this.sortAscending ? "ascending" : "descending"
        })`
      )
    );

    // Show the sorted stats immediately
    this.showStats();
  }

  /**
   * Sort stats array based on current settings
   * @param {Array<Object>} stats - Stats array
   * @returns {Array<Object>} Sorted stats array
   */
  sortStats(stats) {
    const sorted = [...stats];
    const direction = this.sortAscending ? 1 : -1;

    sorted.sort((a, b) => {
      let comparison = 0;

      switch (this.currentSortColumn) {
        case "source":
          comparison = a.source.localeCompare(b.source);
          if (comparison === 0) {
            comparison = a.subsystem.localeCompare(b.subsystem);
          }
          break;
        case "subsystem":
          comparison = a.subsystem.localeCompare(b.subsystem);
          break;
        case "count":
          comparison = a.count - b.count;
          break;
        case "ip":
          comparison = a.senderIp.localeCompare(b.senderIp);
          break;
        default:
          comparison = a.source.localeCompare(b.source);
      }

      return comparison * direction;
    });

    return sorted;
  }

  /**
   * Start auto-refresh timer
   */
  startAutoRefresh() {
    const interval = this.config?.display?.autoRefreshInterval || 5000;
    this.autoRefreshTimer = setInterval(() => {
      // Don't refresh if help is visible
      if (this.helpVisible) {
        return;
      }
      this.showStats();
      this.display.showPrompt();
    }, interval);
  }

  /**
   * Stop auto-refresh timer
   */
  stopAutoRefresh() {
    if (this.autoRefreshTimer) {
      clearInterval(this.autoRefreshTimer);
      this.autoRefreshTimer = null;
    }
  }

  /**
   * Reset all counters
   */
  resetCounters() {
    this.statsTracker.reset();
    console.log(chalk.green("✓ All counters reset"));
  }

  /**
   * Show local IP addresses
   */
  showLocalIPs() {
    const os = require("os");
    const networkInterfaces = os.networkInterfaces();

    console.log(chalk.bold("\n=== Local IP Addresses ===\n"));

    let hasAddresses = false;
    for (const [name, interfaces] of Object.entries(networkInterfaces)) {
      for (const iface of interfaces) {
        // Skip internal (loopback) addresses
        if (iface.internal) continue;

        hasAddresses = true;
        const family =
          iface.family === "IPv4" || iface.family === 4 ? "IPv4" : "IPv6";
        console.log(
          chalk.white(`  ${name}: ${chalk.cyan(iface.address)} (${family})`)
        );
      }
    }

    if (!hasAddresses) {
      console.log(chalk.yellow("  No external network interfaces found"));
    }
    console.log();
  }

  /**
   * Stop the CLI
   */
  stop() {
    this.stopAutoRefresh();
    if (this.rl) {
      this.rl.close();
    }
  }
}

module.exports = CLI;
