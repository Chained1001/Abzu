# Source Manifest

## Table Of Contents

1. Bundled source groups
2. Connected external source library
3. Excluded binaries
4. Authority rules

## Bundled Source Groups

| source_id | source group | contribution | scope | confidence |
|---|---|---|---|---|
| SRC-L0 | L0 specification and v0.2 interface audit | creative-problem and candidate-portfolio operations | pre-commit creative search | provisional theory-grounded project synthesis |
| SRC-L1 | L1 v0.2 specification | reading situation, sought experience, promise and conflict operations | reader-value coordination | provisional; several supplemental theories remain candidates |
| SRC-L2 | L2 specification, demo and L3 entrance audit | long-term state, loop, release, debt and canon control | whole-book and serial release | provisional theory-grounded project synthesis |
| SRC-L3 | L3 specification and L4 entrance calibration | local action, material closure and evidence return | release/scene/action | provisional theory-grounded project synthesis |
| SRC-L4 | L4 specification | reader access, information scheduling, coherence and language realization | prose and local discourse | provisional theory-grounded project synthesis |
| SRC-T001-T072 | 72 theory cards | theory identity, sources, mechanism, boundaries, relations and status | multiple scales and disciplines | per-card status controls authority |
| SRC-ECO | ecosystem registries and matrices | source lookup, claim-evidence, coverage, relations, gaps and audit history | theory ecosystem governance | inherited from project audit |
| SRC-OPEN300 | first-chapter/300-character reports and coding tables | bounded empirical frequency and explanatory-weight checks | sampled Qidian new-book openings | observational, sample- and date-bounded |

Exact original-source records live in:

- `references/ecosystem/03_SOURCE_REGISTRY.csv`
- `references/ecosystem/05_CLAIM_EVIDENCE_MATRIX.csv`
- each file under `references/theory-cards/`

## Connected External Source Library

`references/source-library-config.json` connects this Skill to the complete external source library. The environment variable `WEBNOVEL_THEORY_LIBRARY_ROOT` overrides the machine-specific default path.

Use `references/pdf-source-access.md` and the source scripts to traverse:

```text
theory claim → evidence matrix → source registry → local PDF → verified pages → SOURCE_READ_RECEIPT
```

The bundled ecosystem CSV files are portable lookup snapshots. The external registry and claim matrix at the configured library root are authoritative for file resolution because they travel with the PDF collection.

## Excluded Binaries

Raw PDFs, HTML captures, code/data ZIPs, parquet files, and temporary extraction artifacts are not bundled. Their source library remains outside the Skill and is accessed only through registered paths. Exclusion keeps the Skill small and distributable; it does not authorize claims beyond what was actually retrieved and read.

## Authority Rules

```text
user explicit mandate and boundaries
> direct same-object same-scale evidence
> mature bounded theory
> provisional or inherited theory
> cross-domain translation
> project operationalization
> AI provisional assumption
```

Source links do not prove semantic truth by themselves. A theory card's current status, read depth, scope, negative boundaries, and release audit must accompany any strong claim.

A current-run direct-source claim additionally requires a valid `SOURCE_READ_RECEIPT`. Historical `reading_depth` records describe prior work and do not prove that the current model instance read the PDF.
