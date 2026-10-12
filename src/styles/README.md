# UI conventions

ReloadedFlux uses one control language everywhere ("ghost circles"): quiet,
borderless controls that pick up the active colour palette. Reach for the
shared pieces below instead of styling Arco components per screen.

## Tokens (`tokens.css`)

| Group           | Tokens                                                                                                      |
| --------------- | ----------------------------------------------------------------------------------------------------------- |
| Radius          | `--radius-xs` 4 · `--radius-sm` 6 · `--radius-md` 8 · `--radius-lg` 10 · `--radius-pill` · `--radius-round` |
| Control size    | `--control-h-sm` 28 · `--control-h-md` 32 · `--control-h-lg` 40 · `--icon-sm/md/lg` 12/16/20                |
| Settings widths | `--control-w-sm` (selects, numbers) · `--control-w-lg` (free text, model names)                             |
| Spacing         | `--space-1` … `--space-8` (4px steps)                                                                       |
| Type            | `--font-size-xs` … `--font-size-xl`, `--font-size-title`                                                    |
| Motion          | `--motion-fast/base/slow`, `--ease-standard`; `body[data-animations="off"]` mirrors the in-app toggle       |
| Elevation       | `--elev-raised`, `--elev-1` … `--elev-3`                                                                    |
| Surfaces        | `--surface-popup`, `--surface-popup-border` (menus, popovers, search)                                       |
| Cards           | `--card-radius`, `--card-border`, `--card-hover-bg`, `--card-selected-border`                               |
| Other           | `--color-star`, z-index scale `--z-*`                                                                       |

Colour always comes from Arco tokens (`--color-*`, `--primary-*`, `--gray-*`)
as overridden per palette in `theme.css`. Dark-mode fills are derived from the
palette (`--gray-9`), so never hard-code greys or whites.

## Components (`src/components/ui`)

| Need                                     | Use                                                                                                                     |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Icon-only action                         | `IconButton` (`label` = tooltip + accessible name; `active`, `starred`, `danger`, `open`, `size="sm"`)                  |
| Toolbar action with label / menu trigger | `ToolbarButton` (`caret`, `iconOnly`)                                                                                   |
| Mutually exclusive options               | `SegmentedControl`                                                                                                      |
| Dropdown menu                            | `AppMenu` + `AppMenuItemContent` (icon first; `checked` puts a check at the end; `danger`; `suffix`) + `AppMenuDivider` |
| Confirmation                             | `confirmAction({ danger })` from `utils/confirm`                                                                        |
| Dialog                                   | Arco `Modal` with `className="app-modal app-modal-sm                                                                    | md  | lg"` |
| About / update style dialog              | `HeroDialogHeader`, `HeroDialogLinks`, `HeroDialogDetails` with `className="hero-dialog"`                               |
| Empty or end-of-list state               | `EmptyState` (`tone`: neutral, primary, success, danger)                                                                |
| Load more row                            | `LoadMore`                                                                                                              |
| Clickable inline text                    | `InlineAction`                                                                                                          |
| In-app text link                         | `CustomLink`                                                                                                            |

App-wide Arco overrides live in `arco-overrides.css`; anything specific to one
surface belongs in that surface's CSS, scoped under its own class. ESLint
warns on raw `shape="circle"` buttons and direct `Modal.confirm` calls outside
`components/ui`.
