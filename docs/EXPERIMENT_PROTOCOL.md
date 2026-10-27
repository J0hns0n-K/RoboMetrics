# Protocol v0 — commit before reading results

**Simulation only.** No original physical measurements so far.

## Pre-registered independent variables
1. Obstacles: density 0.12, 0.19, 0.28 (generated on 16×12 grid)
2. Expansion budgets: 75, 120, 180, 300 expanded nodes
3. Algorithms: A* and Greedy Best-First Search (same generated map, start, goal, budget)
4. Seeds: fixed starting seed `20261027`, 30 **solvable** maps per condition; raw accepted seeds in JSON. Publish skipped-map counts in future improvement.

## Dependent metrics
- **Solve rate within expansion budget:** success / 30 reachable trials. `BUDGET_EXCEEDED` and `UNREACHABLE` distinguished; reachable-only dataset excludes latter by design.
- **Mean route length for successes:** step count; report denominator.
- **Relative path length:** route steps / Dijkstra shortest steps, successes only. Ratio 1 means shortest length.
- **Mean expanded nodes:** over all trials, including budget failures. Node count is a proxy and cannot be equated to real robot power usage.
- **Planning runtime:** NOT included in reference version because single-browser wall time is vulnerable to machine noise; if student adds timing, record machine, repetitions and variability.

## Procedure
1. Commit protocol/versions before running the full experiment matrix.
2. Run `node --test test/*.test.mjs`, report exact count.
3. For each density × budget combination, export JSON from a production build; preserve the code commit SHA and runtime environment details.
4. Check a manual small map with known shortest path, a blocked map, and a tight budget against correct expected behavior.
5. Aggregate with counts and correct denominators. Examine at least two opposing or failed trials in detail.
6. Record one change to an algorithm/implementation or experiment plan, explain before/after results, rerun identical seeds.
7. Include limitations, rejected hypotheses, mentor help and code assistance in technical report.

## Engineering decision acceptance
- Reproducible: same seed and code produce same path, expansions, metrics.
- Valid: reference optimal path equals A* path on reachable test maps given sufficient budget.
- Honest: any reported difference is explicitly from synthetic grid experiments, not hardware.
- Interpretive: student articulates which settings favor each algorithm and why.

## Real-world RD protocol gate
Physical tests become valid only when actual robot exists and hardware configuration is logged. Specify platform, wheel spacing/radius, surface, battery level, obstacle locations, start/goal, number of repeated trials, operator interventions, and collision/failure criteria. Do not treat simulation outputs as real-world data.
