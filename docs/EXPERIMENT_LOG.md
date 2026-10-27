# Experiment log

**Status:** No student-run sessions captured. Any batch result in the browser before Junmo modifies/validates the project is a mentor-reference demonstration only.

## 2026-10-27 kickoff — AI reference verification

- Original source: `43fa8ec965180532c1fcf4a553309ed350b25277`.
- Operator: AI assistant; Node v24.22.1 / Windows x64. Original six tests passed.
- Manual student check: Junmo answered 4 moves for the open 3×3 grid in chat. This is separate from running software.
- New validation: independent BFS for all 1,024 obstacle layouts on 4×3; exact expansion-budget boundaries; fixed-map input validation.
- Reference scenario: `experiments/reference-open-grid.json`; same open 3×3 map for all policies; budgets 4/5/8/9. Prediction is AI-authored; no student algorithm prediction has been supplied.
- Preserve actual raw output, source SHA/hashes and test results under `data/reference/`. These are assistant-run demonstrations, not student experiments.
- A student-owned obstacle-map hypothesis, implementation revision, repeated-trial matrix, counterexample analysis, and independent execution remain pending.

Recorded reference results: 11/11 tests passed. Open 3×3: all paths 4 moves; expansions A*=9, Greedy=5, Dijkstra=9. Raw output is `data/reference/open-grid-run-01.json`, generated on clean source commit `10c99f0d4a1bb29b75e0f04b26333a61d3e72eaa`.

Browser smoke export: `data/reference/browser-benchmark.json`, seed 20261027, density .19, budget 180, 30 solvable maps on 16×12. Both solve 30/30; mean moves A*=26.0667, Greedy=28.4; mean expansions A*=118.7667, Greedy=32.7. Operator was AI, not Junmo. One condition only, not the full matrix. Screenshot in the same directory. Current source core/UI match the reference import.

## 2026-10-27 guided exercise — student choices, AI operation

- Input and prior prediction committed first: `97736facb939ed1da56f6255baf405d2646eaa0d`; clean source at execution.
- Student selected a center obstacle on the provided 3×3 grid and predicted four moves, both through AI-provided choices.
- AI transcribed the input and selected teaching budgets 4/5/7/8 based on the reference demo. AI operated the runner.
- Raw: `data/guided/task-01-run-01.json`; source/input hashes and environment included.
- Result: all policies find four moves with enough budget. Expansions A*=8, Greedy=5, Dijkstra=8. At budget 5 Greedy succeeds; the others return `BUDGET_EXCEEDED`. Failed budget trials are preserved.
- This is a single guided exercise, not a repeated random-map study, original algorithm, independent implementation, or physical test.
- Student interpretation, verbatim from chat after seeing the result: **장애물이 있다고 해서 최소 이동 거리가 꼭 바뀌는 것은 아님** (an obstacle does not necessarily change the minimum travel distance). This is supported by comparing the open and center-blocked 3×3 grids, both four moves.
- Student's explanation of differing expansion counts, a code/experiment revision, and independent operation remain pending.

## New experiment template
- Date / local time:
- Git commit SHA:
- Research question / prior prediction:
- Dataset type: synthetic / physical (must be true):
- Grid or robot physical configuration:
- Seeds and n, map family, obstacle density:
- Algorithm variants, expansion budgets:
- Raw JSON / data path:
- Failures and counterexamples:
- Metrics, denominators and uncertainty:
- Interpretations and what is still unknown:
- Student's own implementation/analysis contribution:
- Next experiment:
