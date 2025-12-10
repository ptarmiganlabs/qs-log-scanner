/**
 * Parse UDP messages from Qlik Sense Log4Net subsystem
 * Messages are semicolon-separated with the following structure:
 * [0] Source/Message type
 * [1] Log row number
 * [2] ISO timestamp
 * [3] Local timestamp
 * [4] Log level
 * [5] Host
 * [6] Subsystem (key field)
 * [7] Windows user
 * [8+] Message content (may contain semicolons)
 * [9+] Exception message
 */

class MessageParser {
  /**
   * Parse a UDP message into a structured object
   * @param {Buffer} messageBuffer - Raw UDP message buffer
   * @param {Object} remote - UDP remote info (address, port)
   * @returns {Object} Parsed message object
   */
  parseMessage(messageBuffer, remote) {
    try {
      const message = messageBuffer.toString();
      const msgParts = message.split(';');

      // Ensure we have at least the minimum required fields (0-6 = 7 fields minimum)
      if (msgParts.length < 7) {
        return null;
      }

      // Parse source (field 0) - clean up by removing leading/trailing slashes
      let source = msgParts[0].toLowerCase().replace(/\//g, '');
      
      // Parse other fields
      const logRowNumber = msgParts[1] || '';
      const isoTimestamp = msgParts[2] || '';
      const localTimestamp = msgParts[3] || '';
      const logLevel = msgParts[4] || '';
      const host = msgParts[5] || '';
      const subsystem = msgParts[6] || '';
      const windowsUser = msgParts[7] || '';
      
      // Message content is field 8 onwards (may contain semicolons)
      const messageParts = msgParts.slice(8);
      const messageContent = messageParts.join(';');

      return {
        source,
        logRowNumber,
        isoTimestamp,
        localTimestamp,
        logLevel,
        host,
        subsystem,
        windowsUser,
        messageContent,
        senderIp: remote.address,
        senderPort: remote.port,
        rawMessage: message
      };
    } catch (error) {
      console.error('Error parsing message:', error.message);
      return null;
    }
  }
}

module.exports = MessageParser;
