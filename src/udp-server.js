/**
 * UDP server for receiving Qlik Sense log messages
 */

const dgram = require('dgram');
const EventEmitter = require('events');

class UdpServer extends EventEmitter {
  constructor(config, logger) {
    super();
    this.config = config;
    this.logger = logger;
    this.server = null;
  }

  /**
   * Start the UDP server
   */
  start() {
    return new Promise((resolve, reject) => {
      this.server = dgram.createSocket('udp4');

      this.server.on('error', (err) => {
        this.logger.error(`UDP server error: ${err.message}`);
        this.emit('error', err);
        reject(err);
      });

      this.server.on('message', (msg, remote) => {
        this.logger.debug(
          `Received ${msg.length} bytes from ${remote.address}:${remote.port}`
        );
        this.emit('message', msg, remote);
      });

      this.server.on('listening', () => {
        const address = this.server.address();
        this.logger.info(
          `UDP server listening on ${address.address}:${address.port}`
        );
        console.log(`\n🚀 UDP server listening on ${address.address}:${address.port}\n`);
        resolve();
      });

      this.server.bind(this.config.udp.port, this.config.udp.host);
    });
  }

  /**
   * Stop the UDP server
   */
  stop() {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          this.logger.info('UDP server stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}

module.exports = UdpServer;
