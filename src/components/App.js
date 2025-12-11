/**
 * Main application component - Split screen layout
 * Upper: Stats table with notifications
 * Lower: Fixed command menu
 */

import React, { useState, useEffect, useCallback } from "react";
import { Box, useApp, useInput, useStdout } from "ink";
import StatsTable from "./StatsTable.js";
import CommandMenu from "./CommandMenu.js";
import InputModal from "./InputModal.js";
import NotificationBar from "./NotificationBar.js";
import HelpView from "./HelpView.js";
import IpAddressView from "./IpAddressView.js";
import SearchTermsView from "./SearchTermsView.js";

const h = React.createElement;

const App = ({
  config,
  udpServer,
  statsTracker,
  searchManager,
  onQuit,
  logger,
}) => {
  const { exit } = useApp();
  const { stdout } = useStdout();

  // View state
  const [currentView, setCurrentView] = useState("stats"); // 'stats', 'help', 'ip', 'searchTerms'

  // Stats state
  const [stats, setStats] = useState([]);
  const [totalMessages, setTotalMessages] = useState(0);
  const [senderIPs, setSenderIPs] = useState([]);
  const [uniqueSubsystems, setUniqueSubsystems] = useState(0);

  // Sort state
  const [sortColumn, setSortColumn] = useState("source");
  const [sortAscending, setSortAscending] = useState(true);

  // Auto-refresh state
  const [autoRefresh, setAutoRefresh] = useState(
    config?.display?.autoRefresh || false
  );

  // Notification state
  const [notification, setNotification] = useState(null);

  // Modal state
  const [activeModal, setActiveModal] = useState(null); // null, 'add', 'remove', 'export', 'csv', 'sort'
  const [inputValue, setInputValue] = useState("");

  // Refresh stats from tracker
  const refreshStats = useCallback(() => {
    const allStats = statsTracker.getAllStats();

    // Sort stats
    const sorted = [...allStats].sort((a, b) => {
      const direction = sortAscending ? 1 : -1;
      let comparison = 0;

      switch (sortColumn) {
        case "source":
          comparison = a.source.localeCompare(b.source);
          if (comparison === 0)
            comparison = a.subsystem.localeCompare(b.subsystem);
          break;
        case "subsystem":
          comparison = a.subsystem.localeCompare(b.subsystem);
          break;
        case "count":
          comparison = a.count - b.count;
          break;
        case "ip":
          // Compare first IP in each array
          const aIp = (a.senderIps && a.senderIps[0]) || "";
          const bIp = (b.senderIps && b.senderIps[0]) || "";
          comparison = aIp.localeCompare(bIp);
          break;
        case "logLevel":
          // Compare first log level in each array
          const aLevel = (a.logLevels && a.logLevels[0]) || "";
          const bLevel = (b.logLevels && b.logLevels[0]) || "";
          comparison = aLevel.localeCompare(bLevel);
          break;
        default:
          comparison = a.source.localeCompare(b.source);
      }

      return comparison * direction;
    });

    setStats(sorted);
    setTotalMessages(statsTracker.getTotalMessages());
    setSenderIPs(statsTracker.getAllSenderIPs());
    setUniqueSubsystems(statsTracker.getUniqueSubsystemCount());
  }, [statsTracker, sortColumn, sortAscending]);

  // Show notification helper
  const showNotification = useCallback((message, type = "info") => {
    setNotification({ message, type });
    // Auto-clear after 5 seconds
    setTimeout(() => setNotification(null), 5000);
  }, []);

  // Listen to statsTracker events for new subsystems
  useEffect(() => {
    const handleNewSubsystem = (data) => {
      refreshStats();
      showNotification(`NEW: ${data.source} → ${data.subsystem}`, "success");
    };

    if (statsTracker.on) {
      statsTracker.on("newSubsystem", handleNewSubsystem);
      return () => statsTracker.off("newSubsystem", handleNewSubsystem);
    }
  }, [statsTracker, showNotification]);

  // Auto-refresh timer
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = config?.display?.autoRefreshInterval || 5000;
    const timer = setInterval(refreshStats, interval);

    return () => clearInterval(timer);
  }, [autoRefresh, config, refreshStats]);

  // Initial load
  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  // Command handlers
  const handleAddTerm = useCallback(
    (term) => {
      if (searchManager.addTerm(term)) {
        showNotification(`Added search term: "${term}"`, "success");
      } else {
        showNotification(`Term already exists: "${term}"`, "warning");
      }
      setActiveModal(null);
      setInputValue("");
    },
    [searchManager, showNotification]
  );

  const handleRemoveTerm = useCallback(
    (term) => {
      if (searchManager.removeTerm(term)) {
        showNotification(`Removed search term: "${term}"`, "success");
      } else {
        showNotification(`Term not found: "${term}"`, "warning");
      }
      setActiveModal(null);
      setInputValue("");
    },
    [searchManager, showNotification]
  );

  const handleExportCSV = useCallback(
    async (filename) => {
      const fs = await import("fs");
      const path = await import("path");
      const exportFilename = filename || `qs-log-scanner-${Date.now()}.csv`;
      const exportPath = path.resolve(exportFilename);

      try {
        const allStats = statsTracker.getAllStats();
        if (allStats.length === 0) {
          showNotification("No data to export", "warning");
          setActiveModal(null);
          return;
        }

        const header =
          "Source,Subsystem,Count,Sender IPs,Log Levels,Search Matches";
        const escapeField = (field) => {
          const str = String(field);
          if (str.includes(",") || str.includes('"') || str.includes("\n")) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        };

        const rows = allStats.map((stat) =>
          [
            escapeField(stat.source),
            escapeField(stat.subsystem),
            stat.count,
            escapeField((stat.senderIps || []).join("; ")),
            escapeField((stat.logLevels || []).join("; ")),
            escapeField(stat.searchMatches.join("; ")),
          ].join(",")
        );

        const csvContent = [header, ...rows].join("\n");
        fs.writeFileSync(exportPath, csvContent);
        showNotification(`CSV exported to: ${exportPath}`, "success");
      } catch (error) {
        showNotification(`CSV export failed: ${error.message}`, "error");
      }
      setActiveModal(null);
      setInputValue("");
    },
    [statsTracker, showNotification]
  );

  const handleReset = useCallback(() => {
    statsTracker.reset();
    refreshStats();
    showNotification("All counters reset", "success");
  }, [statsTracker, refreshStats, showNotification]);

  // Keyboard input handler
  useInput((input, key) => {
    // If modal is active, don't process other keys
    if (activeModal) {
      if (key.escape) {
        setActiveModal(null);
      }
      return;
    }

    // Single-key commands
    switch (input.toLowerCase()) {
      case "h":
        if (currentView === "help") {
          setCurrentView("stats");
        } else {
          setCurrentView("help");
        }
        break;
      case "a":
        setActiveModal("add");
        setInputValue("");
        break;
      case "r":
        setActiveModal("remove");
        setInputValue("");
        break;
      case "s":
        if (currentView === "searchTerms") {
          setCurrentView("stats");
        } else {
          setCurrentView("searchTerms");
        }
        break;
      case "x":
        handleReset();
        break;
      case "q":
        if (onQuit) {
          onQuit();
        } else {
          exit();
        }
        break;
      case "i":
        if (currentView === "ip") {
          setCurrentView("stats");
        } else {
          setCurrentView("ip");
        }
        break;
      case "e":
        setActiveModal("csv");
        setInputValue("");
        break;
      case "t":
        setAutoRefresh(!autoRefresh);
        showNotification(
          `Auto-refresh ${!autoRefresh ? "enabled" : "disabled"}`,
          "info"
        );
        break;
      case "o":
        // Cycle through sort columns
        const columns = ["source", "subsystem", "count", "ip"];
        const currentIndex = columns.indexOf(sortColumn);
        const nextIndex = (currentIndex + 1) % columns.length;
        if (columns[nextIndex] === sortColumn) {
          setSortAscending(!sortAscending);
        } else {
          setSortColumn(columns[nextIndex]);
          setSortAscending(true);
        }
        showNotification(`Sorting by ${columns[nextIndex]}`, "info");
        break;
    }

    // Enter key - manual refresh
    if (key.return && !activeModal) {
      refreshStats();
      showNotification("Display refreshed", "info");
    }
  });

  // Get search terms for display
  const getSearchTerms = () => {
    return searchManager.getTerms();
  };

  const terminalHeight = stdout?.rows || 24;
  // Reserve space for command menu (7 lines) and notification bar (1 line)
  const contentHeight = terminalHeight - 9;

  // Build the content view
  let contentView;
  if (currentView === "stats") {
    contentView = h(StatsTable, {
      stats,
      totalMessages,
      senderIPs,
      uniqueSubsystems,
      searchTermCount: searchManager.getTermCount(),
      sortColumn,
      sortAscending,
      maxHeight: contentHeight,
    });
  } else if (currentView === "help") {
    contentView = h(HelpView);
  } else if (currentView === "ip") {
    contentView = h(IpAddressView);
  } else if (currentView === "searchTerms") {
    contentView = h(SearchTermsView, { searchTerms: getSearchTerms() });
  }

  // Build modal if active
  let modal = null;
  if (activeModal === "add") {
    modal = h(InputModal, {
      prompt: "Add search term:",
      value: inputValue,
      onChange: setInputValue,
      onSubmit: handleAddTerm,
    });
  } else if (activeModal === "remove") {
    modal = h(InputModal, {
      prompt: "Remove search term:",
      value: inputValue,
      onChange: setInputValue,
      onSubmit: handleRemoveTerm,
    });
  } else if (activeModal === "csv") {
    modal = h(InputModal, {
      prompt: "Export filename (leave empty for default):",
      value: inputValue,
      onChange: setInputValue,
      onSubmit: handleExportCSV,
    });
  }

  return h(
    Box,
    { flexDirection: "column", height: terminalHeight },
    // Upper area - content view
    h(Box, { flexDirection: "column", flexGrow: 1 }, contentView),
    // Notification bar
    notification &&
      h(NotificationBar, {
        message: notification.message,
        type: notification.type,
      }),
    // Lower area - fixed command menu
    h(CommandMenu, { autoRefresh }),
    // Modal overlay
    modal
  );
};

export default App;
