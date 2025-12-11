/**
 * Notification bar component - displays status messages
 */

import React from 'react';
import { Box, Text } from 'ink';

const h = React.createElement;

const NotificationBar = ({ message, type }) => {
  if (!message) return null;

  const colors = {
    info: 'cyan',
    success: 'green',
    warning: 'yellow',
    error: 'red'
  };

  const icons = {
    info: 'ℹ',
    success: '✓',
    warning: '⚠',
    error: '✗'
  };

  const color = colors[type] || 'white';
  const icon = icons[type] || '';

  return h(Box, { paddingX: 1 },
    h(Text, { color },
      `${icon} ${message}`
    )
  );
};

export default NotificationBar;
