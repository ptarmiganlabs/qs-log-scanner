/**
 * Command menu component - displays available commands
 */

import React from 'react';
import { Box, Text } from 'ink';

const h = React.createElement;

const CommandMenu = ({ autoRefresh }) => {
  const menuItems = [
    // Left column
    [
      { key: 'h', label: 'Help', color: 'white' },
      { key: 'a', label: 'Add search term', color: 'white' },
      { key: 'r', label: 'Remove search term', color: 'white' },
      { key: 's', label: 'Show search terms', color: 'white' },
      { key: 'x', label: 'Clear stats', color: 'white' },
      { key: 'q', label: 'Quit', color: 'red' }
    ],
    // Right column
    [
      { key: 'i', label: 'Show IPs', color: 'white' },
      { key: 'e', label: 'Export CSV', color: 'white' },
      { key: 't', label: `Auto-refresh ${autoRefresh ? '●' : '○'}`, color: autoRefresh ? 'green' : 'gray' },
      { key: 'o', label: 'Sort by column', color: 'white' },
      { key: 'ENTER', label: 'Refresh now', color: 'white' }
    ]
  ];

  const maxItems = Math.max(menuItems[0].length, menuItems[1].length);
  const colWidth = 30;

  const rows = Array.from({ length: maxItems }).map((_, rowIndex) => {
    const leftItem = menuItems[0][rowIndex];
    const rightItem = menuItems[1][rowIndex];

    return h(Box, { key: rowIndex },
      h(Box, { width: colWidth },
        leftItem
          ? h(Text, { color: leftItem.color },
              h(Text, { bold: true, color: 'yellow' }, `[${leftItem.key}]`),
              ` ${leftItem.label}`
            )
          : h(Text, null, ' ')
      ),
      h(Box, { width: colWidth },
        rightItem
          ? h(Text, { color: rightItem.color },
              h(Text, { bold: true, color: 'yellow' }, `[${rightItem.key}]`),
              ` ${rightItem.label}`
            )
          : h(Text, null, ' ')
      )
    );
  });

  return h(Box, {
      flexDirection: 'column',
      borderStyle: 'single',
      borderColor: 'cyan',
      paddingX: 1
    },
    h(Box, { marginBottom: 0 },
      h(Text, { bold: true, color: 'cyan' }, 'Commands')
    ),
    ...rows
  );
};

export default CommandMenu;
