/**
 * Stats table component - displays log statistics
 */

import React from "react";
import { Box, Text } from "ink";

const h = React.createElement;

const StatsTable = ({
  stats,
  totalMessages,
  senderIPs,
  uniqueSubsystems,
  searchTermCount,
  sortColumn,
  sortAscending,
  maxHeight
}) => {
  const sortIndicator = sortAscending ? "▲" : "▼";

  const getHeaderStyle = (col) => {
    if (sortColumn === col) {
      return { bold: true, color: "cyan" };
    }
    return { color: "cyan" };
  };

  // Calculate dynamic subsystem column width based on longest string
  const maxSubsystemLength = stats.reduce(
    (max, stat) => Math.max(max, stat.subsystem ? stat.subsystem.length : 0),
    0
  );

  // Set minimum width of 20 and maximum of 80 for subsystem column
  const subsystemWidth = Math.min(80, Math.max(20, maxSubsystemLength + 2));

  // Column widths
  const colWidths = {
    source: 25,
    subsystem: subsystemWidth,
    count: 8,
    ip: 18,
    logLevel: 12,
    matches: 20,
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

  // Build data rows
  const dataRows = stats.map((stat, index) => {
    // Get IPs as array (handle both old senderIp and new senderIps format)
    const ips = stat.senderIps || (stat.senderIp ? [stat.senderIp] : []);
    const logLevels = stat.logLevels || [];

    // Calculate the number of rows needed for this cell (based on IPs)
    const rowCount = Math.max(ips.length, 1);

    return h(
      Box,
      {
        key: `${stat.source}-${stat.subsystem}-${index}`,
        flexDirection: "row",
        minHeight: rowCount,
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
        { width: colWidths.ip, flexDirection: "column" },
        ips.length > 0
          ? ips.map((ip, ipIdx) =>
              h(Text, { key: ipIdx }, truncate(ip, colWidths.ip))
            )
          : h(Text, null, "")
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
    );
  });

  // Summary elements
  const summaryElements = [
    h(
      Box,
      { key: "summary", marginTop: 1 },
      h(
        Text,
        { color: "green" },
        `Total: ${totalMessages} msgs │ Subsystems: ${uniqueSubsystems} │ Search terms: ${searchTermCount}`
      )
    ),
  ];

  if (senderIPs.length > 0) {
    summaryElements.push(
      h(
        Box,
        { key: "senderips" },
        h(Text, { color: "green" }, `From: ${senderIPs.join(", ")}`)
      )
    );
  }

  // Calculate available height for data rows
  // Reserve space for: title (1), header (1), separator (1), bottom separator (1), summary (2), padding (2)
  const reservedLines = 8;
  const dataRowsHeight = maxHeight ? Math.max(5, maxHeight - reservedLines) : undefined;

  return h(
    Box,
    { flexDirection: "column", padding: 1 },
    h(
      Text,
      { bold: true, color: "cyan" },
      "═══ Qlik Sense Log Scanner - Statistics ═══"
    ),
    headerRow,
    h(Text, { color: "gray" }, "─".repeat(totalWidth)),
    // Scrollable data rows area
    h(
      Box,
      { 
        flexDirection: "column",
        height: dataRowsHeight,
        overflow: "hidden"
      },
      ...dataRows
    ),
    h(Text, { color: "gray" }, "─".repeat(totalWidth)),
    ...summaryElements
  );
};

export default StatsTable;
