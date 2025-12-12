/**
 * Command menu component - displays available commands
 */

import React from "react";
import { Box, Text } from "ink";

const h = React.createElement;

const CommandMenu = ({ autoRefresh }) => {
  const menuItems = [
    // Column 1
    [
      { key: "h", label: "Help", color: "white" },
      { key: "a", label: "Add search term", color: "white" },
      { key: "r", label: "Remove search term", color: "white" },
      { key: "q", label: "Quit", color: "red" },
    ],
    // Column 2
    [
      { key: "s", label: "Show search terms", color: "white" },
      { key: "x", label: "Clear stats", color: "white" },
      { key: "i", label: "Show IPs", color: "white" },
      { key: "e", label: "Export CSV", color: "white" },
    ],
    // Column 3
    [
      {
        key: "t",
        label: `Auto-refresh ${autoRefresh ? "●" : "○"}`,
        color: autoRefresh ? "green" : "gray",
      },
      { key: "o", label: "Sort by column", color: "white" },
      { key: "↑↓", label: "Scroll list", color: "white" },
      { key: "ENTER", label: "Refresh now", color: "white" },
    ],
  ];

  const maxItems = Math.max(
    menuItems[0].length,
    menuItems[1].length,
    menuItems[2].length
  );
  const colWidth = 28;

  const rows = Array.from({ length: maxItems }).map((_, rowIndex) => {
    const col1Item = menuItems[0][rowIndex];
    const col2Item = menuItems[1][rowIndex];
    const col3Item = menuItems[2][rowIndex];

    const renderItem = (item) => {
      if (!item) return h(Text, null, " ");
      return h(
        Text,
        { color: item.color },
        h(Text, { bold: true, color: "yellow" }, `[${item.key}]`),
        ` ${item.label}`
      );
    };

    return h(
      Box,
      { key: rowIndex },
      h(Box, { width: colWidth }, renderItem(col1Item)),
      h(Box, { width: colWidth }, renderItem(col2Item)),
      h(Box, { width: colWidth }, renderItem(col3Item))
    );
  });

  return h(
    Box,
    {
      flexDirection: "column",
      borderStyle: "single",
      borderColor: "cyan",
      paddingX: 1,
    },
    h(
      Box,
      { marginBottom: 0 },
      h(Text, { bold: true, color: "cyan" }, "Commands")
    ),
    ...rows
  );
};

export default CommandMenu;
