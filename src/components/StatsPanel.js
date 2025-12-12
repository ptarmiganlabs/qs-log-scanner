/**
 * Stats panel component - displays summary statistics
 */

import React from "react";
import { Box, Text } from "ink";

const h = React.createElement;

const StatsPanel = ({
  totalMessages,
  uniqueSubsystems,
  searchTermCount,
  senderIPs,
  droppedMessages = 0,
  queueSize = 0,
}) => {
  return h(
    Box,
    {
      flexDirection: "column",
      borderStyle: "single",
      borderColor: "cyan",
      paddingX: 1,
      minWidth: 35,
    },
    h(
      Box,
      { marginBottom: 0 },
      h(Text, { bold: true, color: "cyan" }, "Statistics")
    ),
    h(
      Box,
      null,
      h(Text, { color: "green" }, `Total messages: ${totalMessages}`)
    ),
    h(
      Box,
      null,
      h(Text, { color: "green" }, `Subsystems: ${uniqueSubsystems}`)
    ),
    h(
      Box,
      null,
      h(Text, { color: "green" }, `Search terms: ${searchTermCount}`)
    ),
    h(
      Box,
      null,
      h(
        Text,
        { color: "green" },
        `From: ${senderIPs.length > 0 ? senderIPs.join(", ") : "-"}`
      )
    ),
    // Only show queue/dropped if there are issues
    (queueSize > 0 || droppedMessages > 0) &&
      h(
        Box,
        null,
        h(
          Text,
          { color: droppedMessages > 0 ? "red" : "yellow" },
          `Queue: ${queueSize} | Dropped: ${droppedMessages}`
        )
      )
  );
};

export default StatsPanel;
