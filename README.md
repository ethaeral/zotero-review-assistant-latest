# Zotero Review Assistant Plugin

[![zotero target version](https://img.shields.io/badge/Zotero-7--10-green?style=flat-square&logo=zotero&logoColor=CC2936)](https://www.zotero.org)
[![Using Zotero Plugin Template](https://img.shields.io/badge/Using-Zotero%20Plugin%20Template-blue?style=flat-square&logo=github)](https://github.com/windingwind/zotero-plugin-template)

### IMPORTANT: This plugin supports Zotero 7 through 10 (including 10.0.7)

https://github.com/alima-webdev/zotero-review-assistant/assets/65861197/d350ec1c-214d-4fc3-9f4b-bd23c549a4fd

## Overview

This plugin for Zotero aims to streamline the process of organizing articles for review research. It provides users with the ability to assign statuses such as "Included," "Excluded," or "Unsure" to articles, along with reasons for their current status. Additionally, it offers an automated feature to generate PRISMA flow diagrams, simplifying the reporting process.

## Features

-   **Status Assignment**: Users can easily assign a status to each article in their Zotero library, allowing for efficient organization and tracking of inclusion/exclusion decisions.
-   **Reason Documentation**: Alongside status assignment, users can provide detailed reasons for each status, facilitating transparency and reproducibility in the review process.
-   **PRISMA Flow Diagram Generation**: The plugin automates the creation of PRISMA flow diagrams, saving time and effort in reporting the flow of literature through the review process.
-   **Customization**: The plugin is customizable to fit various review methodologies and reporting standards, ensuring flexibility for different research projects.
-   **Intuitive Interface**: Designed with user experience in mind, the plugin offers a user-friendly interface that integrates seamlessly with Zotero's existing functionalities.

## Installation

1. **Download the plugin**
    - Go to the [Releases](https://github.com/alima-webdev/zotero-review-assistant/releases) section and download the latest `.xpi` file.

2. **Install in Zotero**
    - Open Zotero
    - Navigate to **Tools → Plugins**
    - Click the gear icon in the top-right corner of the window
    - Select **Install Plugin From File…**
    - Choose the downloaded `.xpi` file

## Troubleshooting

- **Columns missing:** In the library, open **View → Columns** and enable **Status**, **PRISMA Category**, and **Status Comments**.
- **Edit review info:** Select item(s) and press **Alt+S**, or use the **Review** items in the item right-click menu.
- **Context menu on Zotero 7 vs 8+:** Zotero 8 and later use the official menu API; Zotero 7 uses compatible menu items appended to the library item menu. If menus look wrong after changing statuses, restart Zotero.

## Development

### Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [pnpm](https://pnpm.io/) 10+ (see `packageManager` in [package.json](package.json))
- A local [Zotero](https://www.zotero.org/download/) 7–10 install for live debugging

### Setup

```bash
pnpm install
cp .env.example .env
```

Edit `.env` and set `ZOTERO_PLUGIN_ZOTERO_BIN_PATH` to your Zotero executable. Optional variables in [.env.example](.env.example) let you use a dedicated profile or data directory.

### Scripts

| Command | Description |
| --- | --- |
| `pnpm start` | Build and load the plugin into Zotero for development |
| `pnpm build` | Production build (`.xpi` under `.scaffold/build/`) |
| `pnpm release` | Release workflow via zotero-plugin-scaffold |
| `pnpm test` | Unit tests (Vitest) |
| `pnpm test:watch` | Unit tests in watch mode |
| `pnpm storybook` | Component docs at http://localhost:6006 |
| `pnpm build-storybook` | Static Storybook in `storybook-static/` |
| `pnpm test-storybook:ci` | Story smoke tests + axe accessibility (needs built Storybook) |

Source lives in `src/`; the scaffold config is [zotero-plugin.config.ts](zotero-plugin.config.ts).

### Testing and quality

This repo uses unit tests, Storybook, automated accessibility checks on stories, and a manual checklist in real Zotero. See **[TESTING.md](TESTING.md)** for the full strategy, file layout, and pre-PR checklist.

Quick local check before opening a pull request:

```bash
pnpm test
pnpm build
pnpm build-storybook
pnpm exec playwright install chromium   # first time only
pnpm test-storybook:ci
```

CI runs the same steps on push and pull requests to `main`.

## Contribution

Contributions are welcome. Please open an issue to discuss larger changes or report bugs.

1. Fork and clone the repository
2. Create a branch for your change
3. Run the tests and build commands above
4. For UI changes, add or update a `*.stories.tsx` and confirm a11y passes (see [TESTING.md](TESTING.md))
5. Open a pull request with a clear description and test plan

## License

This plugin is released under the GNU GENERAL PUBLIC license. See the [LICENSE](LICENSE) file for more details.
