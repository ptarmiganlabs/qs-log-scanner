#!/usr/bin/env node

/**
 * Qlik Sense Log Scanner
 * Main entry point - orchestrates all components
 */

const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");
const winston = require("winston");
const chalk = require("chalk");

// Import modules
const UdpServer = require("./udp-server");
const MessageParser = require("./message-parser");
const StatsTracker = require("./stats-tracker");
const SearchManager = require("./search-manager");
const Display = require("./display");
const CLI = require("./cli");

/**
 * Load configuration
 */
function loadConfig() {
  try {
    const configPath = path.join(__dirname, "..", "config", "default.yaml");
    const fileContents = fs.readFileSync(configPath, "utf8");
    return yaml.load(fileContents);
  } catch (error) {
    console.error(chalk.red(`Error loading config: ${error.message}`));
    process.exit(1);
  }
}

/**
 * Setup logger
 */
function setupLogger(config) {
  const transports = [
    new winston.transports.Console({
      level: config.logging.level,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message }) => {
          return `${timestamp} [${level}]: ${message}`;
        })
      ),
      silent: true, // Silent in console to avoid cluttering CLI
    }),
  ];

  if (config.logging.logToFile) {
    transports.push(
      new winston.transports.File({
        filename: config.logging.logFilePath,
        level: config.logging.level,
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json()
        ),
      })
    );
  }

  return winston.createLogger({ transports });
}

/**
 * Main application class
 */
class QlikSenseLogScanner {
  constructor() {
    this.config = loadConfig();
    this.logger = setupLogger(this.config);

    // Initialize components
    this.messageParser = new MessageParser();
    this.statsTracker = new StatsTracker();
    this.searchManager = new SearchManager();
    this.display = new Display(this.config);
    this.udpServer = new UdpServer(this.config, this.logger);
    this.cli = new CLI(
      this.searchManager,
      this.statsTracker,
      this.display,
      this.logger,
      this.config
    );
  }

  /**
   * Start the application
   */
  async start() {
    console.log(
      chalk.bold.cyan("\n╔═══════════════════════════════════════════╗")
    );
    console.log(
      chalk.bold.cyan("║   Qlik Sense UDP Log Scanner v1.0.0      ║")
    );
    console.log(
      chalk.bold.cyan("╚═══════════════════════════════════════════╝\n")
    );

    // Setup UDP message handler
    this.udpServer.on("message", (msg, remote) => {
      this.handleMessage(msg, remote);
    });

    // Setup error handler
    this.udpServer.on("error", (err) => {
      console.error(chalk.red(`UDP Server Error: ${err.message}`));
    });

    // Start UDP server
    try {
      await this.udpServer.start();
    } catch (error) {
      console.error(chalk.red(`Failed to start UDP server: ${error.message}`));
      process.exit(1);
    }

    // Start CLI
    this.cli.start();

    // Setup graceful shutdown
    this.setupGracefulShutdown();
  }

  /**
   * Handle incoming UDP message
   */
  handleMessage(msg, remote) {
    // Parse the message
    const parsed = this.messageParser.parseMessage(msg, remote);

    if (!parsed) {
      this.logger.warn("Failed to parse message");
      return;
    }

    this.logger.debug(
      `Parsed message from ${parsed.source}/${parsed.subsystem}`
    );

    // Check for search term matches
    const matchingTerms = this.searchManager.findMatches(
      parsed.messageContent + " " + parsed.subsystem
    );

    // Track the message
    const isNewSubsystem = this.statsTracker.trackMessage(
      parsed,
      matchingTerms
    );

    // If new subsystem discovered, show all subsystems
    if (isNewSubsystem) {
      const allStats = this.statsTracker.getAllStats();
      const allSenderIPs = this.statsTracker.getAllSenderIPs();
      this.display.showNewSubsystemDiscovery(
        parsed.source,
        parsed.subsystem,
        allStats,
        allSenderIPs
      );
      this.display.showPrompt();
    }

    // If search terms matched, display the match
    if (matchingTerms.length > 0) {
      this.display.showSearchMatch(
        parsed,
        matchingTerms,
        this.config.display.maxMessagePreview
      );
      this.display.showPrompt();
    }
  }

  /**
   * Setup graceful shutdown handlers
   */
  setupGracefulShutdown() {
    const shutdown = async (signal) => {
      console.log(
        chalk.yellow(`\n\nReceived ${signal}. Shutting down gracefully...`)
      );

      this.cli.stop();
      await this.udpServer.stop();

      console.log(chalk.green("Shutdown complete. Goodbye!\n"));
      process.exit(0);
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
  }
}

// Start the application
const app = new QlikSenseLogScanner();
app.start().catch((error) => {
  console.error(chalk.red(`Fatal error: ${error.message}`));
  process.exit(1);
});
