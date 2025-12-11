#!/usr/bin/env node

/**
 * Qlik Sense Log Scanner
 * Main entry point - orchestrates all components using Ink
 */

import React from 'react';
import { render } from 'ink';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import winston from 'winston';
import { fileURLToPath } from 'url';

// Import services
import UdpServer from './udp-server.js';
import MessageParser from './message-parser.js';
import StatsTracker from './stats-tracker.js';
import SearchManager from './search-manager.js';

// Import main App component
import App from './components/App.js';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Load configuration
 */
function loadConfig() {
  try {
    const configPath = path.join(__dirname, '..', 'config', 'default.yaml');
    const fileContents = fs.readFileSync(configPath, 'utf8');
    return yaml.load(fileContents);
  } catch (error) {
    console.error(`Error loading config: ${error.message}`);
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
 * Main application entry point
 */
async function main() {
  // Load configuration
  const config = loadConfig();
  const logger = setupLogger(config);

  // Initialize services
  const messageParser = new MessageParser();
  const statsTracker = new StatsTracker();
  const searchManager = new SearchManager();
  const udpServer = new UdpServer(config, logger);

  // Setup UDP message handler
  udpServer.on('message', (msg, remote) => {
    // Parse the message
    const parsed = messageParser.parseMessage(msg, remote);

    if (!parsed) {
      logger.warn('Failed to parse message');
      return;
    }

    logger.debug(`Parsed message from ${parsed.source}/${parsed.subsystem}`);

    // Check for search term matches
    const matchingTerms = searchManager.findMatches(
      parsed.messageContent + ' ' + parsed.subsystem
    );

    // Track the message (emits events for new subsystems)
    statsTracker.trackMessage(parsed, matchingTerms);
  });

  // Setup error handler
  udpServer.on('error', (err) => {
    logger.error(`UDP Server Error: ${err.message}`);
  });

  // Start UDP server
  try {
    await udpServer.start();
  } catch (error) {
    console.error(`Failed to start UDP server: ${error.message}`);
    process.exit(1);
  }

  // Setup graceful shutdown
  let inkInstance = null;

  const shutdown = async (signal) => {
    if (inkInstance) {
      inkInstance.unmount();
    }
    await udpServer.stop();
    console.log(`\nShutdown complete. Goodbye!`);
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  // Render the Ink application
  inkInstance = render(
    React.createElement(App, {
      udpServer,
      statsTracker,
      searchManager,
      config,
      logger,
      onQuit: () => shutdown('User quit')
    })
  );

  // Wait for the app to finish
  await inkInstance.waitUntilExit();
}

// Start the application
main().catch((error) => {
  console.error(`Fatal error: ${error.message}`);
  process.exit(1);
});
