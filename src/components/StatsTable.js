/**
 * Stats table component - displays log statistics
 */

import React from "react";
import { Box, Text } from "ink";

const h = React.createElement;

const StatsTable = ({
  stats,
  sortColumn,
  sortAscending,
  maxHeight,
  maxWidth,
  scrollOffset = 0,
}) => {
  const sortIndicator = sortAscending ? "▲" : "▼";

  const getHeaderStyle = (col) => {
    if (sortColumn === col) {
      return { bold: true, color: "cyan" };
    }
    return { color: "cyan" };
  };

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  // Calculate dynamic subsystem column width based on longest string
  const maxSubsystemLength = stats.reduce(
    (max, stat) => Math.max(max, stat.subsystem ? stat.subsystem.length : 0),
    0
  );

  // Constrain total table width to available terminal width to avoid Ink wrapping rows
  // (wrapped rows can push headers out of view when there are many rows).
  const paddingX = 2; // StatsTable uses paddingX: 1
  const usableWidth = Math.max(40, (maxWidth || 80) - paddingX);

  const fixedWidths = {
    source: 15,
    count: 12,
    ip: 12,
    logLevel: 12,
  };

  const subsystemDesired = clamp(maxSubsystemLength + 2, 20, 120);
  const matchesDesired = 20;

  const remaining = Math.max(
    0,
    usableWidth -
      fixedWidths.source -
      fixedWidths.count -
      fixedWidths.ip -
      fixedWidths.logLevel
  );

  // Ensure at least a small Matches column (for readability) while giving Subsystem
  // as much space as possible.
  const minSubsystem = 10;
  const minMatches = 5;

  let matchesWidth = clamp(matchesDesired, minMatches, remaining);
  let subsystemWidth = clamp(
    subsystemDesired,
    minSubsystem,
    remaining - matchesWidth
  );

  // If subsystem couldn't fit, reduce matches to free space.
  if (subsystemWidth < minSubsystem && remaining > 0) {
    matchesWidth = clamp(
      matchesWidth,
      0,
      Math.max(0, remaining - minSubsystem)
    );
    subsystemWidth = clamp(
      subsystemDesired,
      minSubsystem,
      remaining - matchesWidth
    );
  }

  // Final safety: keep within remaining.
  if (subsystemWidth + matchesWidth > remaining) {
    matchesWidth = Math.max(0, remaining - subsystemWidth);
  }

  // Column widths
  const colWidths = {
    source: fixedWidths.source,
    subsystem: subsystemWidth,
    count: fixedWidths.count,
    ip: fixedWidths.ip,
    logLevel: fixedWidths.logLevel,
    matches: matchesWidth,
  };

  const totalWidth =
    colWidths.source +
    colWidths.subsystem +
    colWidths.count +
    colWidths.ip +
    colWidths.logLevel +
    colWidths.matches;

  const truncate = (str, len) => {
    if (!str) return "";
    if (len <= 0) return "";
    return str.length > len ? str.substring(0, len - 1) + "…" : str.padEnd(len);
  };

  if (stats.length === 0) {
    return h(
      Box,
      { flexDirection: "column", padding: 1 },
      h(Text, { bold: true, color: "cyan" }, "═══ Qlik Sense Log Scanner ═══"),
      h(
        Box,
        { marginTop: 1 },
        h(Text, { color: "yellow" }, "Waiting for UDP messages...")
      )
    );
  }

  // Build header row
  const headerRow = h(
    Box,
    { marginTop: 1 },
    h(
      Box,
      { width: colWidths.source },
      h(
        Text,
        getHeaderStyle("source"),
        `Source ${sortColumn === "source" ? sortIndicator : ""}`
      )
    ),
    h(
      Box,
      { width: colWidths.subsystem },
      h(
        Text,
        getHeaderStyle("subsystem"),
        `Subsystem ${sortColumn === "subsystem" ? sortIndicator : ""}`
      )
    ),
    h(
      Box,
      { width: colWidths.count },
      h(
        Text,
        getHeaderStyle("count"),
        `Count ${sortColumn === "count" ? sortIndicator : ""}`
      )
    ),
    h(
      Box,
      { width: colWidths.ip },
      h(
        Text,
        getHeaderStyle("ip"),
        `IP ${sortColumn === "ip" ? sortIndicator : ""}`
      )
    ),
    h(
      Box,
      { width: colWidths.logLevel },
      h(
        Text,
        getHeaderStyle("logLevel"),
        `Level ${sortColumn === "logLevel" ? sortIndicator : ""}`
      )
    ),
    h(Box, { width: colWidths.matches }, h(Text, { color: "cyan" }, "Matches"))
  );

  // Calculate visible rows based on scroll offset
  // Reserved: title(1) + header(1) + top separator(1) + bottom separator(1) + scroll indicator(1) + padding(2) = 7
  const reservedLines = 7;

  // Calculate available lines for data - each row is now 1 line
  const availableLines = maxHeight
    ? Math.max(1, maxHeight - reservedLines)
    : 20;

  // Calculate how many rows we can actually show
  const visibleRowCount = Math.min(stats.length, availableLines);

  // Only create the visible data rows (not all rows then slice)
  const visibleDataRows = [];
  for (
    let i = scrollOffset;
    i < scrollOffset + visibleRowCount && i < stats.length;
    i++
  ) {
    const stat = stats[i];
    // Get IPs as array (handle both old senderIp and new senderIps format)
    const ips = stat.senderIps || (stat.senderIp ? [stat.senderIp] : []);
    const logLevels = stat.logLevels || [];

    // Extract last octet from each IP and join them
    const lastOctets = ips
      .map((ip) => {
        const parts = ip.split(".");
        return parts.length === 4 ? parts[3] : ip;
      })
      .join(",");

    visibleDataRows.push(
      h(
        Box,
        {
          key: `${stat.source}-${stat.subsystem}-${i}`,
          flexDirection: "row",
        },
        h(
          Box,
          { width: colWidths.source },
          h(Text, null, truncate(stat.source, colWidths.source))
        ),
        h(
          Box,
          { width: colWidths.subsystem },
          h(Text, null, truncate(stat.subsystem, colWidths.subsystem))
        ),
        h(
          Box,
          { width: colWidths.count },
          h(Text, null, String(stat.count).padStart(6))
        ),
        h(
          Box,
          { width: colWidths.ip },
          h(Text, null, truncate(lastOctets, colWidths.ip))
        ),
        h(
          Box,
          { width: colWidths.logLevel },
          h(
            Text,
            { color: "magenta" },
            truncate(logLevels.join(","), colWidths.logLevel)
          )
        ),
        h(
          Box,
          { width: colWidths.matches },
          h(
            Text,
            { color: "yellow" },
            truncate(stat.searchMatches.join(", "), colWidths.matches)
          )
        )
      )
    );
  }

  // Calculate scroll indicator
  const canScrollUp = scrollOffset > 0;
  const canScrollDown = scrollOffset + visibleRowCount < stats.length;
  const hasMoreRows =
    stats.length > visibleRowCount || canScrollUp || canScrollDown;
  const scrollInfo = hasMoreRows
    ? ` [${scrollOffset + 1}-${Math.min(
        scrollOffset + visibleRowCount,
        stats.length
      )}/${stats.length}]`
    : "";

  // Build scroll indicator row
  const scrollIndicatorRow = h(
    Box,
    { key: "scroll-indicator" },
    canScrollUp
      ? h(Text, { color: "cyan" }, "▲ ")
      : h(Text, { color: "gray" }, "  "),
    h(Text, { color: "gray" }, `↑↓ scroll${scrollInfo}`),
    canScrollDown
      ? h(Text, { color: "cyan" }, " ▼")
      : h(Text, { color: "gray" }, "  ")
  );

  // Calculate the height for the data section
  const dataHeight = visibleRowCount;

  return h(
    Box,
    { flexDirection: "column", paddingX: 1 },
    // Fixed header section - these should always show
    h(
      Text,
      { bold: true, color: "cyan" },
      "═══ Qlik Sense Log Scanner - Statistics ═══"
    ),
    headerRow,
    h(Text, { color: "gray" }, "─".repeat(Math.min(totalWidth, usableWidth))),
    // Data rows in a fixed-height container
    h(
      Box,
      { flexDirection: "column", height: dataHeight, overflow: "hidden" },
      ...visibleDataRows
    ),
    // Fixed footer section
    h(Text, { color: "gray" }, "─".repeat(Math.min(totalWidth, usableWidth))),
    // Always show scroll indicator when there are more rows than visible
    hasMoreRows && scrollIndicatorRow
  );
};

export default StatsTable;
