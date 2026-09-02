# Unified Register Import Design

## Goal

Make RailOps register import deterministic and durable by routing every supported register file through one pre-processing entry point before the existing v145 business engine. The concrete acceptance case is `REGISTRE_DPI2455_MAJ_8.xlsm`: 735 unique current inventory references across RETOUR, CONTAINER-01, ROISSY and VEMARS, with two same-site duplicate rows and a stale announced count of 548, while keeping `Analyser avant import` enabled.

## Scope

This change is limited to the register ingestion path. It must not change Supabase schema, RLS, authentication, permissions, weekly verification purge, import history semantics, chantier creation rules, material move rules, or multi-chantier business rules.

Supported file formats remain XLSX, XLS, XLSM, XLSB, ODS, CSV and TXT. PDF remains unsupported.

## Existing problem

RailOps currently contains multiple historical import implementations and wrappers (v132, v140, v145 plus compatibility hotfixes). The actual file-picker path is intercepted in capture phase and can call the v145 `generalizedImport(input)` binding directly. Because older and newer wrappers coexist, a file can bypass normalization and reach `sourceQuality(sheet)` with recoverable defects still present. `structuredModal()` disables `#ro144-analyze` whenever `sourceQuality(sheet).ok` is false.

For the DPI2455 workbook, the recoverable defects are:
- announced count 548 while the parsed unique inventory count is 735;
- two exact duplicate references inside the same site;
- no cross-site duplicate ambiguity.

Those conditions must not block analysis.

## Architecture

Introduce one focused module responsible for register pre-processing and entry-point installation. It will become the only handler invoked from the file-picker capture listener. The module will parse the selected file once, inspect all workbook tabs, normalize recoverable structured-register defects in memory, then pass the normalized workbook/file to the existing v145 routing and modal logic.

The v145 engine remains authoritative for parsing sheets into business items, source routing, preview, chantier mapping, creation/reuse, moves, history and final mutations. No business mutation is moved into the new module.

Historical v132/v140 import functions may remain defined for compatibility, but they must no longer be reachable from the active file-picker path.

## Pre-processing rules

For structured sheets with a detected reference column and site/location column:

1. Normalize reference and site keys only for comparison.
2. Exact duplicate rows with the same normalized reference and same normalized site are recoverable. Keep the first occurrence and suppress later duplicates in the in-memory workbook.
3. A stale declared count such as `548 articles` is informational. When it differs from the unique structured count, update only the in-memory copy so v145 quality checks see the actual unique count.
4. A reference assigned to more than one normalized site is ambiguous and remains blocking. Do not auto-resolve it.
5. Do not use movement/history tabs (`TRANSFERT`, `RETOUR`, `RETOURS`, alerts, audit, hidden lookup lists) as current inventory merely because they contain references. v145 structured-source selection remains authoritative; for DPI2455 the source must remain `INVENTAIRE`.
6. Never modify the uploaded workbook on disk.

## Single entry point

The capture-phase `change` listener must invoke one exported function, e.g. `window.RailOpsRegisterImportV156.handleInput(input)`, instead of calling `generalizedImport(input)` directly.

The entry point is responsible for:
- accepting the original `<input type=file>`;
- rejecting unsupported types with existing behavior;
- pre-processing Excel-family files when needed;
- forwarding CSV/TXT unchanged to v145;
- creating a real browser `File` for rewritten Excel content;
- calling the original v145 importer exactly once.

There must be no second active capture listener that independently imports the same file.

## Quality policy

`sourceQuality()` semantics remain unchanged for genuine defects. The pre-processor only removes recoverable defects before v145 evaluates quality.

After pre-processing the DPI2455 inventory source must reach v145 with:
- 735 unique items;
- 0 same-site duplicates;
- declared count matching 735 for the in-memory read;
- 0 cross-site duplicates.

Therefore `sourceQuality(sheet).ok` is true and `#ro144-analyze` is enabled.

## User-visible behavior

When recoverable defects are normalized, show one concise warning toast indicating how many exact duplicates were neutralized and that an obsolete announced total was corrected for reading. The modal should then behave like any normal structured multi-chantier import.

No new confirmation step is added.

## Testing

Add regression coverage that proves:

1. The active capture listener routes through the unified import entry point and no longer calls `generalizedImport(input)` directly.
2. The DPI2455-shaped structured dataset with 737 rows, two same-site duplicates and a stale 548 count normalizes to 735 unique rows and passes quality.
3. Cross-site duplicates remain blocking and are not normalized away.
4. The in-memory rewritten workbook is passed as a real `File` where browser APIs require one.
5. The v145 button-rendering condition receives an `ok` quality state for the recoverable-defect case.
6. Existing lifecycle, modules, RLS-hotfix and v150B-2B regression suites remain green.

## Deployment

Implementation happens first on `security/v150b2b-rls-ready`. `main` stays untouched until branch tests and Vercel preview are green. Production receives only the minimal import-path changes needed for this fix, not unrelated security-branch changes.

## Acceptance criteria

The change is accepted when the exact DPI2455 workbook can be selected in production and the structured import modal shows the four current sites with 735 unique references total, while `Analyser avant import` is clickable. Genuine cross-site ambiguities must still block validation.