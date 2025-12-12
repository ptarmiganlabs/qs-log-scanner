/**
 * UDP server for receiving Qlik Sense log messages
 */

import dgram from "dgram";
import { EventEmitter } from "events";

class UdpServer extends EventEmitter {
  constructor(config, logger) {
    super();
    this.config = config;
    this.logger = logger;
    this.server = null;

    // Message queue for buffering incoming messages
    this.messageQueue = [];
    this.isProcessing = false;
    this.droppedMessages = 0;
    this.maxQueueSize = config.udp?.maxQueueSize || 10000;

    // Receive buffer size (in bytes) - default 8MB
    this.receiveBufferSize = config.udp?.receiveBufferSize || 8 * 1024 * 1024;
  }

  /**
   * Get dropped message count
   */
  getDroppedMessageCount() {
    return this.droppedMessages;
  }

  /**
   * Get current queue size
   */
  getQueueSize() {
    return this.messageQueue.length;
  }

  /**
   * Start the UDP server
   */
  start() {
    return new Promise((resolve, reject) => {
      this.server = dgram.createSocket({
        type: "udp4",
        reuseAddr: true,
      });

      this.server.on("error", (err) => {
        this.logger.error(`UDP server error: ${err.message}`);
        this.emit("error", err);
        reject(err);
      });

      this.server.on("message", (msg, remote) => {
        // Queue the message for processing
        if (this.messageQueue.length < this.maxQueueSize) {
          this.messageQueue.push({ msg, remote, timestamp: Date.now() });
          this.processQueue();
        } else {
          // Queue is full, drop the message
          this.droppedMessages++;
          if (this.droppedMessages % 100 === 1) {
            this.logger.warn(
              `Message queue full, dropped ${this.droppedMessages} messages total`
            );
          }
        }
      });

      this.server.on("listening", () => {
        const address = this.server.address();

        // Set receive buffer size for better handling of message bursts
        try {
          this.server.setRecvBufferSize(this.receiveBufferSize);
          const actualSize = this.server.getRecvBufferSize();
          this.logger.info(
            `UDP receive buffer size set to ${actualSize} bytes`
          );
        } catch (err) {
          this.logger.warn(`Could not set receive buffer size: ${err.message}`);
        }

        this.logger.info(
          `UDP server listening on ${address.address}:${address.port}`
        );
        console.log(
          `\n🚀 UDP server listening on ${address.address}:${address.port}\n`
        );
        resolve();
      });

      this.server.bind(this.config.udp.port, this.config.udp.host);
    });
  }

  /**
   * Process queued messages asynchronously
   */
  processQueue() {
    if (this.isProcessing || this.messageQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    // Process messages in batches using setImmediate to avoid blocking
    const processBatch = () => {
      const batchSize = Math.min(100, this.messageQueue.length);

      for (let i = 0; i < batchSize; i++) {
        const item = this.messageQueue.shift();
        if (item) {
          this.logger.debug(
            `Received ${item.msg.length} bytes from ${item.remote.address}:${item.remote.port}`
          );
          this.emit("message", item.msg, item.remote);
        }
      }

      if (this.messageQueue.length > 0) {
        setImmediate(processBatch);
      } else {
        this.isProcessing = false;
      }
    };

    setImmediate(processBatch);
  }

  /**
   * Stop the UDP server
   */
  stop() {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          this.logger.info("UDP server stopped");
          if (this.droppedMessages > 0) {
            this.logger.warn(`Total dropped messages: ${this.droppedMessages}`);
          }
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}

export default UdpServer;
