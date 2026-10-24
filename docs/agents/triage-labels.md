# Triage Labels

The skills speak in terms of five canonical triage roles. This file maps those roles to the actual label strings used in this repo's issue tracker.

| Label in mattpocock/skills | Label in our tracker | Meaning                                  |
| -------------------------- | -------------------- | ---------------------------------------- |
| `needs-triage`             | `needs-triage`       | Maintainer needs to evaluate this issue  |
| `needs-info`               | `needs-info`         | Waiting on reporter for more information |
| `ready-for-agent`          | `ready-for-agent`    | Fully specified, ready for an AFK agent  |
| `ready-for-human`          | `ready-for-human`    | Requires human implementation            |
| `wontfix`                  | `wontfix`            | Will not be actioned                     |

When a skill mentions a role (e.g. "apply the AFK-ready triage label"), use the corresponding label string from this table.

Edit the "Label in our tracker" column to match whatever vocabulary you actually use.

## Notes for this repo

- `wontfix` predates this setup: it is one of GitHub's stock labels and was already present. The other four were created for this vocabulary.
- GitHub's stock `question` label ("Further information is requested") overlaps with `needs-info`. They are **not** synonyms here: use `needs-info` when the issue cannot proceed without more from the reporter (the state a skill should set), and leave `question` as a free-form human marker.
- No `wayfinder:*` labels exist yet. `/wayfinder` creates them on first use.
