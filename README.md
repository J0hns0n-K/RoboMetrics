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

- **Checks:** the latest [geometry suite](data/footprint/disk-footprint-tests-01.tap) passes 70 tests, including seven disk-footprint controls. Earlier archives retain their source-bound results. Existing audits check 1,024 small layouts against separate BFS, replay historical policy metrics, and test budget/resume/bound correctness; these controls are not independent research samples.
- **Evidence:** [protocol](docs/EXPERIMENT_PROTOCOL.md), [raw baseline data](data/batch/), [raw tie-rule data](data/tie-break/), source revisions, hash manifests and [experiment log](docs/EXPERIMENT_LOG.md) support the numerical claims.
- **Attribution:** the initial scaffold and subsequent implementation, automated tests and archived batch execution are AI-authored or AI-operated. Junmo's documented contributions include guided choices, parameter edits, a manually supplied shortest route, interpretations and the demo-default choice. The [contribution log](docs/CONTRIBUTION_LOG.md) separates these roles; this overview is AI-assisted writing.
- **Limits:** static, fully known, four-connected unit-cost grids; reachable-only sampling; fixed seed cohorts. Tie-breaking is established prior work. These results do not establish a universal winner or physical robot performance.

## Testing the prediction on a second cohort

Junmo predicted before execution that rule 2 would again examine fewer nodes. The [registered follow-up](experiments/tie-break-validation-02.protocol.json) fixes base seed 20262027, density .19, budget 300 and 30 reachable maps. Both downloaded files now pass AI replay and paired checks: both rules find shortest routes on 30/30 maps, mean moves are 26.00 for each, and mean examined nodes change from 117.77 to 33.80, about 71.3% lower. Rule 2 examines fewer nodes on every map in this cohort. This supports the recorded direction on these maps; it does not establish universal superiority. The [follow-up record](docs/TIE_BREAK_VALIDATION_02_RESULTS.md) links raw files, hashes, source checks and provenance limits, separating the student's prediction/readings from AI validation.

## Where the reduction did not appear

Junmo selected a goal-side dead end, chose a four-cell branch in the AI-proposed 7×3 layout, and predicted similar examined-node counts before execution. After that forecast was committed, AI implemented and operated a paired fixed-map evaluator. Both rules found a shortest ten-move route and examined 15 nodes at budget 300: no reduction in this case. In a guided post-result interpretation, Junmo concluded that rule 2 cannot be said to reduce examined nodes on every map because the latest case showed no change. This limits an always-fewer-nodes assertion without showing that the alternative is worse. The [structured-case record](docs/STRUCTURED_MAP_TASK_KR.md) preserves his exact statement, full paths, source revisions, tests and attribution.

## Separating a layout improvement from a rule improvement

Junmo chose wall A from two proposed edits, gave a route-position rationale, and predicted six minimum moves before execution. Opening A confirmed that forecast. For an AI-proposed B-only control, he then predicted unchanged FIFO search work relative to the stated 15 nodes. Both edits start from the original map, change exactly one different wall, and retain the same search code and budget 300:

| Layout | Shortest moves, both rules | FIFO examined nodes | Closer-goal examined nodes |
|---|---:|---:|---:|
| Original | 10 | 15 | 15 |
| Open A only | 6 | 7 | 7 |
| Open B only | 10 | 16 | 12 |

Opening A improves route length and work for both policies. Opening B leaves shortest length unchanged while FIFO examines one more node and closer-goal three fewer. The unchanged-FIFO expectation was not borne out. In a guided post-result interpretation, Junmo concluded that wall removal need not reduce examined nodes, citing both the increase and decrease. This controlled case shows why fewer walls need not mean less search; the algorithm's ordering matters even when optimal distance is unchanged. The [case record](docs/STRUCTURED_MAP_TASK_KR.md) preserves predictions, exact student explanations and separate AI analysis. Full paths, source checks and [A](data/structured/goal-side-dead-end-open-A-comparison-01.json)/[B](data/structured/goal-side-dead-end-open-B-comparison-01.json) validation distinguish environment edits from changes to the search implementation. These are individual constructed cases, not general effect-size estimates.

## Distinguishing failure to find a path from no path

When asked to formulate his current question, Junmo wanted to know what is returned when the destination cannot be reached. An AI-prepared disconnected 3×3 example produces `UNREACHABLE` after examining the six cells connected to the start, with false success, an empty path and null path length. At budget 2 the same map instead returns `BUDGET_EXCEEDED`. Opening one goal-neighbor wall creates a matched connected map: Junmo predicted budget exhaustion at budget 2 before execution, which was observed, but budget 300 then finds a four-move route. In his guided post-result explanation, he concluded that a reduced budget can cause failure even when a route exists, so that status alone cannot establish no path. Independent grid traversals verify connectivity and shortest distance; the [failure-semantics record](docs/FAILURE_SEMANTICS_KR.md) links exact statements, raw outputs and provenance. These fixed cases remain outside the random benchmark's reachable-only cohort, and the student question/forecast/interpretation are distinct from AI map design and execution.

## Current route-update design

The investigation now separates an invalid old route from an unreachable goal, and a usable cached route from a completed optimization. Junmo chose further optimization, adopted the AI-proposed lower-bound check and selected denser and smaller-budget follow-ups. AI supplied the implementations, test protocols, execution and initial analysis. The [Korean synthesis](docs/ENGINEERING_SUMMARY_KR.md) and [contribution log](docs/CONTRIBUTION_LOG.md) preserve exact student statements and assistance rather than imply independent algorithm authorship.

On static four-neighbor unit-cost grids, a valid remaining route attaining Manhattan(current, goal) is already shortest. The [route-update policy](docs/MANHATTAN_BOUND_SKIP_KR.md) checks latest-map validity first, skips only that proven case, and otherwise reoptimizes. Removing one deterministic wall produced no shortening on the development cohort; 28/30 old routes already reached the 26-move lower bound. This motivated the check. Matched comparisons use 16×12 reachable parent/edited pairs, A* FIFO and budget 300 per invocation:

| Cohort, 30 shared map pairs | Mean moves, both policies | Forced reoptimization: new expansions | Bound check: new expansions |
|---|---:|---:|---:|
| [Development, base20264027/.19](data/route-update-policy/manhattan-bound-validation-01.json) | 26.13 | 3,733 | 201 |
| [Frozen-rule follow-up, base20265027/.28](data/route-update-policy/bound-skip-followup-dense-validation-01.json) | 26.67 | 2,690 | 844 |

All 30 paths in each comparison remain identical between policies and match independent BFS distances. Development performance is a replay on the cohort used to propose the rule. The denser condition was frozen before generation; it uses 21 bound proofs and nine actual searches and preserves one wall-removal improvement from 28 to 26 moves. Changed seeds and density do not isolate a causal density effect. These are node counts, not runtime/energy measurements; zero new planner expansions still requires map/path checks. Offline prior-route acquisition and all rejection audits are recorded separately in the linked protocols/manifests.

At [budget100 on the same dense inputs](docs/BOUND_SKIP_BUDGET100_KR.md), the guard yields 21 proofs, six completed searches and three optimization timeouts. All cached returns remain usable; those timeouts are not called completed searches. Junmo chose bounded further optimization. AI set one additional50 stage: the [continuation comparison](data/route-update-policy/continuation-100-150-validation-01.json) uses 798 expansions to stop at100, 844 to resume to cumulative150, or1,144 to restart at fresh150. All paths/lengths stay the same. Resume adds46 expansions to finish three confirmations and avoids300 repeated expansions versus restart; it does not shorten routes in this control. Search sessions, stages, original failures and finite caps remain separate. The [method](docs/ROUTE_CONTINUATION_KR.md) documents this AI implementation and the explicit modes preserving historical baselines.

## First robot-model gap: body size

Junmo [reports no robot available yet](data/learning/robot-hardware-context-01.json). The next model therefore uses explicitly assumed geometry: a circular disk, closed square-cell obstacles, cell side1 in virtual units, and contact treated as collision. This is a geometry reference, not physical measurements. The [registered controls](experiments/disk-footprint-corridor-01.protocol.json) compare point/disk sizes, a one-cell versus three-cell doorway and an added clearance margin. A* runs on excluded disk-center cells, followed by swept-edge checks against the original obstacle geometry. The [method](docs/DISK_FOOTPRINT_KR.md) distinguishes endpoint-clearance failure, graph reachability and budget failure. Seven geometry controls pass in the 70-test suite; configured fixture execution awaits committed source/inputs.

Core point-planner results and the current browser benchmark remain intact. Robot motion, differential-drive kinematics, waypoint control and sensing uncertainty remain future work. If hardware becomes available, dimensions and physical trials must be measured and recorded separately. [Research roadmap](docs/ROBOTICS_ROADMAP.md)

## Run and inspect

Requires Node.js 18 or later; no dependency installation is needed.

```sh
npm test
npm start
```

Open http://127.0.0.1:8080/ for the Korean demo. Source is in `src/`, inputs in `experiments/`, runners in `scripts/`, and tests in `test/`.

For deeper review: [algorithm notes](docs/ALGORITHM_REVIEW_KR.md), [engineering record](docs/ENGINEERING_REPORT.md), [assumptions and limitations](docs/RESEARCH_ARGUMENT.md), [data guide](data/README.md), and [repository workflow](docs/GITHUB_KICKOFF.md).
