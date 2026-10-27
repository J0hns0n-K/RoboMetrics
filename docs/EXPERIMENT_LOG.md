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

## Template
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
