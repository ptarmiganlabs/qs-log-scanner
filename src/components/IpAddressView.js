/**
 * IP address view component - displays local network interfaces
 */

import React from 'react';
import { Box, Text } from 'ink';
import os from 'os';

const h = React.createElement;

const IpAddressView = () => {
  const getLocalIPs = () => {
    const interfaces = os.networkInterfaces();
    const addresses = [];
    
    for (const [name, nets] of Object.entries(interfaces)) {
      for (const net of nets) {
        // Skip internal and non-IPv4 addresses
        if (!net.internal && net.family === 'IPv4') {
          addresses.push({
            interface: name,
            address: net.address,
            netmask: net.netmask
          });
        }
      }
    }
    
    return addresses;
  };

  const ips = getLocalIPs();

  const content = ips.length === 0
    ? [h(Text, { key: 'empty', color: 'yellow' }, 'No network interfaces found')]
    : [
        // Header
        h(Box, { key: 'header' },
          h(Box, { width: 20 }, h(Text, { bold: true, color: 'cyan' }, 'Interface')),
          h(Box, { width: 18 }, h(Text, { bold: true, color: 'cyan' }, 'IP Address')),
          h(Box, { width: 18 }, h(Text, { bold: true, color: 'cyan' }, 'Netmask'))
        ),
        h(Text, { key: 'sep', color: 'gray' }, '─'.repeat(56)),
        // IP rows
        ...ips.map((ip, index) =>
          h(Box, { key: index },
            h(Box, { width: 20 }, h(Text, { color: 'yellow' }, ip.interface)),
            h(Box, { width: 18 }, h(Text, { color: 'green' }, ip.address)),
            h(Box, { width: 18 }, h(Text, { color: 'gray' }, ip.netmask))
          )
        )
      ];

  return h(Box, { flexDirection: 'column', padding: 1 },
    h(Text, { bold: true, color: 'cyan' }, '═══ Local IP Addresses ═══'),
    h(Box, { marginTop: 1 }),
    ...content,
    h(Box, { marginTop: 1 },
      h(Text, { color: 'gray' }, 'Press [i] to return to main view')
    )
  );
};

export default IpAddressView;
