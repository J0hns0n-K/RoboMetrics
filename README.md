# RoboMetrics

**How much search is enough to find a usable route?**

RoboMetrics investigates a practical planning trade-off: a method can find short routes yet fail to return any route within a fixed search budget. Using reproducible grid maps, the project separates three questions: whether a route is found, how long it is, and how much search was required. A* and Greedy Best-First Search provide contrasting policies; Dijkstra supplies a shortest-path reference.

The work has progressed from hand-checked maps to paired experiments and a controlled A* tie-breaking comparison. The current result is a simulation benchmark with traceable data and design decisions. Its longer-term question is how those decisions hold up when robot motion and sensing uncertainty enter the model.

## How the investigation developed

**Start with a path that can be checked by hand.** A guided center-obstacle exercise showed that adding a wall need not increase shortest-path length. Later, on an AI-selected map where Greedy returned 12 moves and A* returned 8, Junmo supplied a different valid eight-move route without removing any walls. Its length matches the Manhattan lower bound, providing a direct optimality check. [Route and verification](docs/COUNTEREXAMPLE_01_KR.md)

**Separate route quality from finding a route within the budget.** The paired matrix varies obstacle density and examined-node limits while holding maps fixed within each density. Failed searches remain in the data; route-length comparisons identify their successful-map denominators. After reviewing results, Junmo articulated that shorter routes and more budgeted successes are different properties. [Method and recorded interpretation](docs/MATRIX_RUN_KR.md)

**Test a detail hidden by the algorithm name.** A subsequent AI-designed comparison keeps A*'s primary score, f=g+h, unchanged and varies only how equal-score candidates are ordered. FIFO is compared with preferring the candidate nearer the goal. This isolates a concrete implementation choice rather than attributing every effect to A* as a whole. [Controlled comparison](docs/TIE_BREAK_STUDY_KR.md)

## What the evidence currently shows

One controlled slice uses the same 30 reachable 16×12 maps, base seed 20261027 and obstacle-generation probability .19:

| Search policy | Routes found, budget 120 | Routes found, budget 300 | Mean moves, budget 300 | Mean examined nodes, budget 300 |
|---|---:|---:|---:|---:|
| A*, FIFO ties | 15/30 | 30/30 | 26.07 | 118.77 |
| A*, closer-goal ties | 30/30 | 30/30 | 26.07 | 36.97 |
| Greedy Best-First | 30/30 | 30/30 | 28.40 | 32.70 |

At budget 300, all three policies finish on this cohort, so the route-length means compare the same maps. Changing A* tie order preserves shortest returned lengths here while reducing mean examined nodes. Greedy examines fewer nodes but returns longer routes on average. These are measured node counts, not runtime or energy measurements.

The [full baseline matrix](docs/MATRIX_RESULTS.md) and [tie-rule results](docs/TIE_BREAK_RESULTS.md) report every tested density and budget, including failures. Each study reuses 90 density-specific map entries across 360 map/budget conditions; these are not 360 independent maps. Runs and implementation are AI-assisted as detailed below.

## From evidence to a working design

After the comparison, Junmo tentatively chose the closer-goal rule as the browser default. The demo exposes both rules, applies the selection to individual maps and the 30-map comparison, records it in JSON exports, and clears stale results when settings change. The library and CLI retain FIFO for compatibility with the original experiments. [Decision and acceptance evidence](docs/DEMO_DESIGN_DECISION.md)

Guided browser comparisons now examine route quality alongside search work. At the instructed budget 300, Junmo reported mean route lengths of 26.07 moves across 30 successful maps for each rule, with mean examined-node counts of 118.77 for FIFO and 36.97 for closer-goal. Earlier reports at budget 120 gave 15/30 and 30/30 successes respectively. In a guided post-result interpretation, he described full success with rule 2, similar mean route length and substantially fewer examined nodes. At budget 300 both rules succeeded; the distinction there is search work, rather than an increase in success. These readings and interpretation connect the chosen default to both metrics. The user-reported observations remain separate from the archived AI-operated datasets; they are not independently verified replications or a general performance guarantee. [Exact statement and context](docs/DEMO_DESIGN_DECISION.md)

After Junmo reported saving, the downloaded [rule-2/budget-300 JSON](data/browser-reports/closer-goal-budget300-report-01.json) was preserved byte-for-byte. AI validation reproduced its complete benchmark payload and matched all 30 A* and 30 Greedy rows to the earlier study. The [validation record](data/browser-reports/closer-goal-budget300-report-01.validation.json) distinguishes verified file contents from unrecorded browser-operator/source provenance; these remain the same previously studied maps.

## Reproducibility, scope and contributions

- **Checks:** the latest [fixed-map validation suite](data/structured/fixed-tie-tests-01.tap) passes 23 tests; the earlier demo acceptance archive retains its 20-test result. Algorithm audits cover all 1,024 obstacle layouts of a small 4×3 grid against an independently written BFS; compatibility checks reproduce 720 historical A*/Greedy metrics.
- **Evidence:** [protocol](docs/EXPERIMENT_PROTOCOL.md), [raw baseline data](data/batch/), [raw tie-rule data](data/tie-break/), source revisions, hash manifests and [experiment log](docs/EXPERIMENT_LOG.md) support the numerical claims.
- **Attribution:** the initial scaffold and subsequent implementation, automated tests and archived batch execution are AI-authored or AI-operated. Junmo's documented contributions include guided choices, parameter edits, a manually supplied shortest route, interpretations and the demo-default choice. The [contribution log](docs/CONTRIBUTION_LOG.md) separates these roles; this overview is AI-assisted writing.
- **Limits:** static, fully known, four-connected unit-cost grids; reachable-only sampling; fixed seed cohorts. Tie-breaking is established prior work. These results do not establish a universal winner or physical robot performance.

## Testing the prediction on a second cohort

Junmo predicted before execution that rule 2 would again examine fewer nodes. The [registered follow-up](experiments/tie-break-validation-02.protocol.json) fixes base seed 20262027, density .19, budget 300 and 30 reachable maps. Both downloaded files now pass AI replay and paired checks: both rules find shortest routes on 30/30 maps, mean moves are 26.00 for each, and mean examined nodes change from 117.77 to 33.80, about 71.3% lower. Rule 2 examines fewer nodes on every map in this cohort. This supports the recorded direction on these maps; it does not establish universal superiority. The [follow-up record](docs/TIE_BREAK_VALIDATION_02_RESULTS.md) links raw files, hashes, source checks and provenance limits, separating the student's prediction/readings from AI validation.

## Where the reduction did not appear

Junmo selected a goal-side dead end, chose a four-cell branch in the AI-proposed 7×3 layout, and predicted similar examined-node counts before execution. After that forecast was committed, AI implemented and operated a paired fixed-map evaluator. Both rules found a shortest ten-move route and examined 15 nodes at budget 300: no reduction in this case. In a guided post-result interpretation, Junmo concluded that rule 2 cannot be said to reduce examined nodes on every map because the latest case showed no change. This limits an always-fewer-nodes assertion without showing that the alternative is worse. The [structured-case record](docs/STRUCTURED_MAP_TASK_KR.md) preserves his exact statement, full paths, source revisions, tests and attribution.

## Next research step

Refine the structured case through a single-wall edit while holding the remaining map and search settings fixed. Junmo chose wall A from two proposed edits and gave a route-position rationale; opening A connects the top-row route. His exact wording and an explicit clarification about the original blocked path are preserved in the [design record](docs/STRUCTURED_MAP_TASK_KR.md). A numerical route-length forecast and the revised experiment remain pending. This tests how a controlled layout change affects route length and search work, retaining equal or unfavorable cases alongside gains. The planned robotics extension introduces body geometry, differential-drive motion, waypoint tracking and sensor/actuator uncertainty. Matched physical trials depend on obtaining and testing hardware; no physical measurements have been collected. [Research roadmap](docs/ROBOTICS_ROADMAP.md)

## Run and inspect

Requires Node.js 18 or later; no dependency installation is needed.

```sh
npm test
npm start
```

Open http://127.0.0.1:8080/ for the Korean demo. Source is in `src/`, inputs in `experiments/`, runners in `scripts/`, and tests in `test/`.

For deeper review: [algorithm notes](docs/ALGORITHM_REVIEW_KR.md), [engineering record](docs/ENGINEERING_REPORT.md), [assumptions and limitations](docs/RESEARCH_ARGUMENT.md), [data guide](data/README.md), and [repository workflow](docs/GITHUB_KICKOFF.md).
