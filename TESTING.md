# Testing

Zotero plugins mix browser UI, Zotero APIs, and pure TypeScript logic. This project uses a **layered strategy**: fast automated tests where possible, Storybook for components, axe for accessibility, and manual smoke tests inside Zotero for integration.

## Quick reference

| Layer | Tool | Command |
| --- | --- | --- |
| Unit | [Vitest](https://vitest.dev/) | `pnpm test` / `pnpm test:watch` |
| Components | [Storybook](https://storybook.js.org/) 8 | `pnpm storybook` |
| Story + a11y (CI) | `@storybook/test-runner` + [axe-playwright](https://github.com/abhinaba-ghosh/axe-playwright) | `pnpm build-storybook` then `pnpm test-storybook:ci` |
| Plugin build | zotero-plugin-scaffold | `pnpm build` |
| Integration | Manual | Checklist below + `pnpm start` in Zotero |

## Repository layout

```
tests/
  setup/zotero-globals.ts   # Minimal Zotero stub for Vitest
  helpers/mockItem.ts       # Fake Zotero.Item for tag/status tests
  unit/*.test.ts            # Unit tests

.storybook/
  main.ts                   # Storybook + Tailwind via Vite
  preview.ts                # Global styles + Zotero stub
  test-runner.ts            # Injects axe and fails on violations

src/**/*.stories.tsx        # One story file per component (colocated)
```

Stories currently cover **Modal**, **Table**, and **KeystrokeInput**. Add a `*.stories.tsx` beside new shared UI under `src/components/`.

## Unit tests (Vitest)

```bash
pnpm test          # once (used in CI)
pnpm test:watch    # on file save
```

- Tests import from `src/` and run in **Node** (no Zotero install required).
- `tests/setup/zotero-globals.ts` sets `Zotero.isLinux` (and related flags) so keystroke formatting is stable in CI.

### When to add unit tests

- **Yes:** parsing, JSON prefs, tag/status matching, PRISMA label formatting, keystroke helpers, any extracted pure functions.
- **Use mocks:** logic that needs `Zotero.Item` — see `tests/helpers/mockItem.ts`.
- **Usually not in Vitest:** code that only calls Zotero APIs, file pickers, or full React views unless you extract testable logic first.

### Planned improvements (optional)

- Extract PRISMA payload building from `src/views/prismaView.tsx` into a module and unit test rollups and “comments as exclusion reasons”.
- Fixture test for docx generation (mock template load; skip file picker).

## Storybook and accessibility

Stories render components in isolation with Tailwind (`src/styles/styles.css`) and the same kind of **Zotero stub** as unit tests (`.storybook/preview.ts`).

### Local development

```bash
pnpm storybook
```

Open http://localhost:6006. Use the **Accessibility** addon panel to inspect violations while editing stories. Preview is configured with `a11y.test: "error"` so the addon treats violations seriously during development.

### Automated story and a11y tests

These mirror CI:

```bash
pnpm build-storybook
pnpm exec playwright install chromium   # first time on a machine
pnpm test-storybook:ci
```

- `test-storybook:ci` serves `storybook-static/` and runs the test runner with **axe** on `#storybook-root` for every story (see `.storybook/test-runner.ts`).
- For a running dev server instead of static files, use `pnpm test-storybook` (requires Storybook already on port 6006).

### Writing accessible stories

Automated axe checks fail when stories (or components) violate WCAG rules. Prefer:

- Visible labels linked to inputs (`<label>` / `aria-label`)
- Dialogs with a title and `aria-labelledby` (see `Modal`)
- Data tables with `<th scope="col">` in the header row (see `Table`)
- Sufficient color contrast on buttons and text (see `.btn-primary` in `src/styles/styles.css`)

Fix accessibility in **components**, not by disabling rules in the test runner, unless there is a documented false positive.

## Manual smoke checklist (Zotero 7–10)

Run after UI or integration changes and before releases:

1. **Load plugin:** `pnpm start` (or install the built `.xpi`) — no errors on enable.
2. **Columns:** Enable **Status**, **PRISMA Category**, and **Status Comments** via **View → Columns** if needed; badges render for tagged items.
3. **Status:** Assign and clear status via shortcuts or UI; tags update on selected items.
4. **Comments:** Comment prefix tags apply and replace correctly when edited.
5. **PRISMA:** Open the generate dialog, submit with a sample selection; `.docx` saves and opens.
6. **Preferences:** Plugin preferences panel loads and saves settings.
7. **Teardown:** Close/reopen the main window or disable the plugin — columns and menus clean up without errors.

## Continuous integration

GitHub Actions workflow [`.github/workflows/test.yml`](.github/workflows/test.yml) on **push** and **pull_request** to `main`:

1. `pnpm install --frozen-lockfile`
2. `pnpm test`
3. `pnpm build`
4. Install Playwright Chromium
5. `pnpm build-storybook`
6. `pnpm test-storybook:ci`

All steps must pass before merge.

## Suggested pre-PR workflow

```bash
pnpm test
pnpm build
pnpm build-storybook
pnpm test-storybook:ci
```

Then run the [manual smoke checklist](#manual-smoke-checklist-zotero-710) if you touched Zotero integration, menus, columns, or preferences.
