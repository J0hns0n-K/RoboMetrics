# Full paired-matrix results — 2026-10-28

AI-operated synthetic grid study. The student's later guided interpretation distinguishing path length from budgeted success is preserved verbatim in `MATRIX_RUN_KR.md`; it is not a pre-run forecast or an independently operated study.

| Density | Budget | A* successes / 30 | Greedy successes / 30 | Shared successes | Mean Greedy extra moves on shared successes |
|---:|---:|---:|---:|---:|---:|
| 0.12 | 75 | 0 | 30 | 0 | — |
| 0.12 | 120 | 1 | 30 | 1 | 0.00 |
| 0.12 | 180 | 30 | 30 | 30 | 1.67 |
| 0.12 | 300 | 30 | 30 | 30 | 1.67 |
| 0.19 | 75 | 1 | 30 | 1 | 0.00 |
| 0.19 | 120 | 15 | 30 | 15 | 1.60 |
| 0.19 | 180 | 30 | 30 | 30 | 2.33 |
| 0.19 | 300 | 30 | 30 | 30 | 2.33 |
| 0.28 | 75 | 8 | 29 | 8 | 1.25 |
| 0.28 | 120 | 28 | 30 | 28 | 2.64 |
| 0.28 | 180 | 30 | 30 | 30 | 2.47 |
| 0.28 | 300 | 30 | 30 | 30 | 2.47 |

The shared-success denominator matters: length comparisons condition on both policies finding a path. A dash means no shared successes. Original per-policy success-conditioned means and their separate denominators remain in CSV/JSON.

| Density | Candidates checked | Accepted | Rejected as unreachable |
|---:|---:|---:|---:|
| 0.12 | 30 | 30 | 0 |
| 0.19 | 34 | 30 | 4 |
| 0.28 | 56 | 30 | 26 |

Source: `2dda59173bfc99ce0c9ad418f3724edf621d6a1e`; clean source at execution. 16/16 tests passed. Core algorithms are unchanged.

There are 90 density-specific cohort entries, reused for 360 map/budget pairs and 720 A*/Greedy calls. They are not 360 independent maps or 720 independent trials. Reference and audit calls are additional validation operations, not counted as new data.

Raw data, CSV, TAP, SHA256 manifest and three post-hoc AI-selected full-path failure/quality reports are in `data/batch/`.

Scope: reachable-only random grids, fixed seed stream and implementation including FIFO ties. Higher density cohorts differ after reachability filtering. This does not establish general superiority, physical robot performance, or a new algorithm.
