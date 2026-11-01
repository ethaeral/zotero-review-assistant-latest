# Testing

This project uses a layered testing strategy suited to Zotero plugins: fast automated unit tests for pure logic, optional integration tests with mocks (future), and manual smoke checks in a real Zotero install.

## Storybook and accessibility

Component stories run in isolation with Tailwind styles and a stubbed `Zotero` global (see `.storybook/preview.ts`).

```bash
pnpm storybook              # dev UI at http://localhost:6006 (includes a11y addon panel)
pnpm build-storybook        # static output in storybook-static/
pnpm test-storybook:ci      # build must exist; runs story tests + axe a11y checks
```

The **Accessibility** addon flags violations while developing. **CI** runs `@storybook/test-runner` with `axe-playwright` on every story after `pnpm build-storybook`.

Add a `*.stories.tsx` next to new UI components. Keep stories accessible (labels, dialog titles, table headers) so automated a11y tests pass.

## Automated tests (Vitest)

From the repository root:

```bash
pnpm test          # run once (CI uses this)
pnpm test:watch    # re-run on file changes
```

Tests live under `tests/` and import code from `src/`. They run in Node with a minimal global `Zotero` stub (`tests/setup/zotero-globals.ts`) so keystroke formatting and similar helpers behave predictably (Linux labels by default).

### What to unit test

- **Do add tests** for pure functions: parsing, tag/status matching, PRISMA label formatting, JSON preference parsing, keystroke helpers.
- **Prefer mocks** when testing logic that needs `Zotero.Item` (see `tests/helpers/mockItem.ts`).
- **Defer or manual-test** code that only wires Zotero APIs, DOM, file pickers, or React views unless you extract testable logic first.

### Follow-ups (not required for every change)

- Extract PRISMA payload building from `src/views/prismaView.tsx` into a dedicated module and unit test rollups and “comments as exclusion reasons”.
- Snapshot or fixture test for docx generation (mock template loading and skip the file picker).
- Prefer Storybook stories + `test-storybook:ci` for component and a11y coverage.

## Manual smoke checklist (Zotero 7–10)

Run after meaningful UI or integration changes, and before releases:

1. **Load plugin**: `pnpm start` (or install built `.xpi`) and confirm the plugin enables without errors.
2. **Columns**: Status and PRISMA Category columns appear; badges/labels render for tagged items.
3. **Status assignment**: Assign/clear status via shortcuts or UI; tags update on selected items.
4. **Comments**: Comments prefix tags apply and replace correctly when edited.
5. **PRISMA**: Open generate dialog, submit with sample selection; `.docx` saves and opens.
6. **Preferences**: Plugin preferences panel loads and saves settings.
7. **Teardown**: Close/reopen main window or disable plugin without errors (columns/menu cleaned up).

## CI

GitHub Actions runs `pnpm test`, `pnpm build`, and Storybook a11y tests (`pnpm build-storybook` + `pnpm test-storybook:ci`) on push and pull requests.
