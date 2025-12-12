/**
 * Help view component - displays keyboard shortcuts help
 */

import React from 'react';
import { Box, Text } from 'ink';

const h = React.createElement;

const HelpView = () => {
  const helpSections = [
    {
      title: 'Navigation & Display',
      items: [
        { key: 'h', desc: 'Show/hide this help screen' },
        { key: 'Enter', desc: 'Refresh display now' },
        { key: 't', desc: 'Toggle auto-refresh on/off' }
      ]
    },
    {
      title: 'Search',
      items: [
        { key: 'a', desc: 'Add a search term to highlight matches' },
        { key: 'r', desc: 'Remove a search term' },
        { key: 's', desc: 'Show all active search terms' }
      ]
    },
    {
      title: 'Sorting',
      items: [
        { key: 'o', desc: 'Cycle through sort columns' },
        { key: '', desc: 'Columns: source → subsystem → count → ip → source...' }
      ]
    },
    {
      title: 'Data Management',
      items: [
        { key: 'x', desc: 'Clear all statistics and start fresh' },
        { key: 'e', desc: 'Export current stats to CSV file' }
      ]
    },
    {
      title: 'Information',
      items: [
        { key: 'i', desc: 'Show local IP addresses' }
      ]
    },
    {
      title: 'Application',
      items: [
        { key: 'q', desc: 'Quit the application' }
      ]
    }
  ];

  const sections = helpSections.map((section, sectionIndex) =>
    h(Box, { key: sectionIndex, flexDirection: 'column', marginBottom: 1 },
      h(Text, { bold: true, color: 'yellow' }, section.title),
      ...section.items.map((item, itemIndex) =>
        h(Box, { key: itemIndex },
          item.key
            ? [
                h(Box, { key: 'key', width: 10 },
                  h(Text, { color: 'green' }, `[${item.key}]`)
                ),
                h(Text, { key: 'desc' }, item.desc)
              ]
            : h(Box, { marginLeft: 10 },
                h(Text, { color: 'gray' }, item.desc)
              )
        )
      )
    )
  );

  return h(Box, { flexDirection: 'column', padding: 1 },
    h(Text, { bold: true, color: 'cyan' }, '═══ Help - Keyboard Shortcuts ═══'),
    h(Box, { marginTop: 1 }),
    ...sections,
    h(Box, { marginTop: 1 },
      h(Text, { color: 'gray' }, 'Press [h] to return to main view')
    )
  );
};

export default HelpView;
