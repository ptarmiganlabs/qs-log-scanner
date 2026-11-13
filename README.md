<h1 align="center">qs-log-scanner</h1>

<p align="center"><strong>Terminal UI for exploring Qlik Sense log events sent over UDP</strong></p>

<p align="center">
<a href="https://github.com/ptarmiganlabs/qs-log-scanner/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-MIT-green" alt="License: MIT"></a>
<a href="https://github.com/sponsors/ptarmiganlabs"><img src="https://img.shields.io/badge/Sponsor-%E2%9D%A4-db61a2?logo=githubsponsors" alt="Sponsor Ptarmigan Labs on GitHub"></a>
</p>

<p align="center">
<a href="#install">Install</a> ·
<a href="https://github.com/ptarmiganlabs/qs-log-scanner/discussions">Questions</a> ·
<a href="https://github.com/ptarmiganlabs/qs-log-scanner/issues">Report a bug</a> ·
<a href="https://github.com/sponsors/ptarmiganlabs">❤️ Sponsor</a>
</p>

Receives Qlik Sense Log4Net UDP messages, parses them, and shows a live, terminal UI with aggregated stats per subsystem.

Blog post: [qs-log-scanner: open source tool for exploring Qlik Sense logs](https://ptarmiganlabs.com/qs-log-scanner-open-source-tool-for-exploring-qlik-sense-logs/)

## ❤️ Support the project

qs-log-scanner is free and open source, under the MIT licence. If you use it, please consider sponsoring its development: sponsorships pay for maintenance, bug fixes and new features, and keep the project going.

**[❤️ Sponsor Ptarmigan Labs on GitHub](https://github.com/sponsors/ptarmiganlabs)**

Other ways to help:

- ⭐ **Star the repository**: it helps others find the project.
- 💬 **Share your feedback** in [Discussions](https://github.com/ptarmiganlabs/qs-log-scanner/discussions): tell us how you use it.
- 🐛 **Report issues** in [Issues](https://github.com/ptarmiganlabs/qs-log-scanner/issues).
- 🍴 **Contribute**: pull requests are welcome.

_Maintained by [Göran Sander](https://github.com/mountaindude) and supported by [Ptarmigan Labs](https://ptarmiganlabs.com)._

---

## What it does

- Listens on a UDP socket (configurable host/port).
- Parses semicolon-separated Log4Net UDP messages.
- Aggregates counts per `(source, subsystem)`.
- Tracks sender IPs and log levels seen per subsystem.
- Tracks search term matches (message content + subsystem).
- Renders a live table in the terminal (Ink) with keyboard shortcuts.
- Exports the current aggregated stats to CSV.

## Requirements

- Node.js `>= 20`

## Install

```bash
npm install
```

## Configure

Edit `config/default.yaml`:

```yaml
udp:
  port: 9999
  host: "192.168.3.250"
  receiveBufferSize: 8388608
  maxQueueSize: 10000

display:
  refreshInterval: 5000
  maxMessagePreview: 100
  autoRefresh: true
  autoRefreshInterval: 5000

logging:
  level: info
  logToFile: true
  logFilePath: ./logs/scanner.log
```

Notes:

- `udp.host` is the interface to bind to. Use `0.0.0.0` to listen on all interfaces.
- `receiveBufferSize` increases the UDP receive buffer to better handle bursts.
- `maxQueueSize` is the maximum number of messages buffered in-process; when exceeded, messages are dropped.
- `display.autoRefresh` and `display.autoRefreshInterval` control the table refresh.
- `display.refreshInterval` and `display.maxMessagePreview` are present in `config/default.yaml` but are not currently used by the UI.

## Run

```bash
npm start
```

Hot reload during development:

```bash
npm run dev
```

## UI (keyboard)

The app is keyboard-driven.

- `h`: toggle help
- `a`: add search term
- `r`: remove search term
- `s`: show/hide search terms
- `i`: show/hide local IP addresses
- `e`: export CSV (prompts for filename)
- `x`: clear stats
- `t`: toggle auto-refresh
- `o`: change sort (cycles `source↑ → source↓ → subsystem↑ → subsystem↓ → count↑ → count↓ → ip↑ → ip↓`)
- `↑/↓`: scroll table
- `PageUp/PageDown`: scroll a page
- `Enter`: refresh now
- `q`: quit

## Table columns

The stats table aggregates by `(source, subsystem)` and shows:

- **Source**: parsed from field `0` with `/` stripped and lowercased
- **Subsystem**: field `6`
- **Count**: number of messages received for that `(source, subsystem)`
- **IP**: sender IPs (UI shows last octet(s); full IPs are written to CSV)
- **Level**: distinct log levels seen for the subsystem
- **Matches**: search terms that matched for that subsystem

## CSV export

Export writes one row per `(source, subsystem)` with these columns:

`Source,Subsystem,Count,Sender IPs,Log Levels,Search Matches`

Lists are joined with `"; "` inside the CSV field. If you don’t provide a filename, it uses `qs-log-scanner-<timestamp>.csv` in the current working directory.

CSV export is the only export supported in the UI.

## UDP message format

Messages are expected to be semicolon-separated, with at least 7 fields:

| Index | Field                                  |
| ----: | -------------------------------------- |
|     0 | Source (e.g. `/qseow-root/`)           |
|     1 | Log row number                         |
|     2 | ISO timestamp                          |
|     3 | Local timestamp                        |
|     4 | Log level                              |
|     5 | Host                                   |
|     6 | Subsystem                              |
|     7 | Windows user                           |
|    8+ | Message content (joined back with `;`) |

## Reliability notes

UDP can drop packets under load. This tool also has an internal queue; if the queue fills up, it will drop messages.

When the app detects backlog/drops, the Statistics panel shows:

```text
Queue: <n> | Dropped: <n>
```

If `Dropped` is non-zero, some messages were not processed.

## Troubleshooting

### No messages

- Verify `udp.host` and `udp.port` in `config/default.yaml`.
- Ensure firewalls allow inbound UDP on the chosen port.
- Confirm Qlik Sense is configured to send UDP logs to this host/port.

### Ink raw mode error

Ink requires a TTY for keyboard input. Run the app in a normal terminal (not via a pipeline or a process that doesn’t provide a real `stdin`).

## License

MIT. See `LICENSE`.
