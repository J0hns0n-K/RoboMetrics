# A* tie-breaking comparison — 2026-10-28

AI-implemented and AI-operated controlled comparison. Student qualitative input and operational scope are in `TIE_BREAK_STUDY_KR.md` and the protocol.

| Density | Budget | FIFO successes / 30 | Closer-goal successes / 30 | FIFO mean examined | Closer-goal mean examined | Success gains | Success losses |
|---:|---:|---:|---:|---:|---:|---:|---:|
| 0.12 | 75 | 0 | 30 | 75.00 | 33.17 | 30 | 0 |
| 0.12 | 120 | 1 | 30 | 119.10 | 33.17 | 29 | 0 |
| 0.12 | 180 | 30 | 30 | 146.17 | 33.17 | 0 | 0 |
| 0.12 | 300 | 30 | 30 | 146.17 | 33.17 | 0 | 0 |
| 0.19 | 75 | 1 | 29 | 74.90 | 36.43 | 28 | 0 |
| 0.19 | 120 | 15 | 30 | 110.73 | 36.97 | 15 | 0 |
| 0.19 | 180 | 30 | 30 | 118.77 | 36.97 | 0 | 0 |
| 0.19 | 300 | 30 | 30 | 118.77 | 36.97 | 0 | 0 |
| 0.28 | 75 | 8 | 28 | 71.90 | 41.97 | 20 | 0 |
| 0.28 | 120 | 28 | 30 | 88.23 | 42.27 | 2 | 0 |
| 0.28 | 180 | 30 | 30 | 88.63 | 42.27 | 0 | 0 |
| 0.28 | 300 | 30 | 30 | 88.63 | 42.27 | 0 | 0 |

Means include all 30 rows, including failures capped at the budget. They are not uncensored time-to-completion estimates.

## Preselected representative condition

At density .19 and budget 120, success changes 15/30 to 30/30. At budget 300, both succeed on the same 30 maps; mean examined nodes change 118.77 to 36.97, a 68.87% reduction in this node-count metric, not a runtime/energy claim. Mean successful path length remains 26.07 moves for both rules.

## Small fixed teaching control

| Rule | Path moves | Examined nodes |
|---|---:|---:|
| FIFO | 4 | 8 |
| Closer-goal on ties only | 4 | 5 |

## Validation and limits

All 19 tests passed. All 720 historical default A*/Greedy policy metrics matched the baseline; all successful A* variants in this corpus matched the reference shortest length. Source: `260ac09d063c422b92acef8ad4a6afbb622429f7`. Experiment inputs were committed; an unrelated practice-file edit remained in the workspace and is declared in execution metadata.

These are 360 paired map/budget comparisons reusing 90 density-specific cohort entries, not 360 independent maps. The alternative is an established tie policy implemented by AI. No universal gain, original algorithm invention, student code authorship or physical result is claimed. FIFO remains the library/CLI default; after this study the student tentatively selected closer-goal as the browser demo default, with both options exposed. See `DEMO_DESIGN_DECISION.md`. No additional student numerical interpretation is inferred from that preference.
