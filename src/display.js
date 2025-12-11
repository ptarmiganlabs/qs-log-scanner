/**
 * Display statistics in text-based tables
 */

const Table = require("cli-table3");
const chalk = require("chalk");

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
   * @param {Array<string>} allSenderIPs - All unique sender IPs
   * @param {string} sortColumn - Current sort column
   * @param {boolean} sortAscending - Sort direction
   */
  showStatsTable(
    stats,
    totalMessages,
    activeSearchTerms,
    uniqueSubsystems,
    allSenderIPs = [],
    sortColumn = "source",
    sortAscending = true
  ) {
    if (stats.length === 0) {
      console.log(
        chalk.yellow("\nNo data collected yet. Waiting for UDP messages...\n")
      );
      return;
    }

    // Create header with sort indicator
    const sortIndicator = sortAscending ? "▲" : "▼";
    const getHeader = (name, col) => {
      if (sortColumn === col) {
        return chalk.cyan.bold(`${name} ${sortIndicator}`);
      }
      return chalk.cyan(name);
    };

    const table = new Table({
      head: [
        getHeader("Source", "source"),
        getHeader("Subsystem", "subsystem"),
        getHeader("Count", "count"),
        getHeader("Sender IP", "ip"),
        chalk.cyan("Search Matches"),
      ],
      colWidths: [30, 50, 10, 18, 25],
    });

    for (const stat of stats) {
      table.push([
        stat.source,
        stat.subsystem,
        stat.count.toString(),
        stat.senderIp,
        stat.searchMatches.join(", "),
      ]);
    }

    console.clear();
    console.log(chalk.bold("\n=== Qlik Sense Log Scanner - Statistics ===\n"));
    console.log(table.toString());
    console.log(
      chalk.green(
        `\nTotal messages: ${totalMessages} | ` +
          `Active search terms: ${activeSearchTerms} | ` +
          `Unique subsystems: ${uniqueSubsystems}`
      )
    );
    if (allSenderIPs.length > 0) {
      console.log(
        chalk.green(`Messages received from: ${allSenderIPs.join(", ")}\n`)
      );
    } else {
      console.log();
    }
  }

  /**
   * Display new subsystem discovery
   * @param {string} source - Source name
   * @param {string} subsystem - Subsystem name
   * @param {Array<Object>} allStats - All current stats
   * @param {Array<string>} allSenderIPs - All unique sender IPs
   */
  showNewSubsystemDiscovery(source, subsystem, allStats, allSenderIPs = []) {
    console.clear();
    const timestamp = new Date().toLocaleString();
    console.log(
      chalk.green.bold(
        `\n[${timestamp}] NEW SUBSYSTEM DISCOVERED: ${source} -> ${subsystem}\n`
      )
    );

    console.log(chalk.bold("=== All Known Subsystems (sorted) ===\n"));

    const table = new Table({
      head: [
        chalk.cyan("Source"),
        chalk.cyan("Subsystem"),
        chalk.cyan("Count"),
        chalk.cyan("Sender IP"),
        chalk.cyan("Search Matches"),
      ],
      colWidths: [25, 70, 10, 18, 25],
    });

    for (const stat of allStats) {
      table.push([
        stat.source,
        stat.subsystem,
        stat.count.toString(),
        stat.senderIp,
        stat.searchMatches.join(", "),
      ]);
    }

    console.log(table.toString());
    if (allSenderIPs.length > 0) {
      console.log(
        chalk.white(
          `\nMessages received from: ${chalk.cyan(allSenderIPs.join(", "))}\n`
        )
      );
    } else {
      console.log();
    }
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
    const previewText =
      preview.length < parsedMessage.messageContent.length
        ? `${preview}...`
        : preview;

    console.log(
      chalk.yellow.bold(
        `\n[${timestamp}] SEARCH MATCH: ${matchingTerms.join(", ")}`
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
    console.clear();
    console.log(chalk.bold("\n=== Qlik Sense Log Scanner ==="));
    console.log(
      chalk.cyan("\nCommands (use number, letter, or full command):")
    );
    console.log("  1.  s   stats              - Show current statistics table");
    console.log("  2.  a   add <term>         - Add a search term");
    console.log("  3.  r   remove <term>      - Remove a search term");
    console.log("  4.  l   list               - List all active search terms");
    console.log("  5.  c   clear              - Clear all search terms");
    console.log(
      "  6.  e   export [filename]  - Export current data to JSON file"
    );
    console.log(
      "          csv [filename]     - Export current data to CSV file"
    );
    console.log(
      "          auto               - Toggle auto-refresh of statistics"
    );
    console.log(
      "          sort <column>      - Sort table (source/subsystem/count/ip)"
    );
    console.log("  7.  x   reset              - Reset all counters");
    console.log("  8.  i   ip                 - Show local IP addresses");
    console.log("  9.  h   help               - Show this help");
    console.log("  10. q   quit               - Exit the application");
    console.log();
  }

  /**
   * Show command prompt
   */
  showPrompt() {
    process.stdout.write(chalk.bold("\nEnter command: "));
  }
}

module.exports = Display;
