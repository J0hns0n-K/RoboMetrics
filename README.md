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

- **Checks:** the latest [suite archive](data/footprint/resolution-policy-tests-01.tap) records 86 passing tests, including seven resolution-policy controls; [validation](data/footprint/resolution-policy-controls-validation-01.json) binds the exact test/source/input hashes. Earlier archives retain their source-bound results. Existing audits check 1,024 small layouts against separate BFS, replay historical policy metrics, and test budget/resume/bound correctness; these controls are not independent research samples.
- **Evidence:** [protocol](docs/EXPERIMENT_PROTOCOL.md), [raw baseline data](data/batch/), [raw tie-rule data](data/tie-break/), source revisions, hash manifests and [experiment log](docs/EXPERIMENT_LOG.md) support the numerical claims.
- **Attribution:** the initial scaffold and subsequent implementation, automated tests and archived batch execution are AI-authored or AI-operated. Junmo's documented contributions include guided choices, parameter edits, a manually supplied shortest route, interpretations and the demo-default choice. The [contribution log](docs/CONTRIBUTION_LOG.md) separates these roles; this overview is AI-assisted writing.
- **Limits:** static, fully known, four-connected unit-cost grids. Random studies sample reachable parent maps; designed failure/body controls also include unreachable graphs. The disk model is assumed geometry, not motion dynamics or measured hardware. Tie-breaking is established prior work; these results do not establish a universal winner or physical robot performance.

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

## First robot-model gap: body size and representation

Junmo [reports no robot available yet](data/learning/robot-hardware-context-01.json). The model therefore uses assumed circular bodies, closed square-cell obstacles, cell side1 in virtual units and forbidden contact. A* searches a disk-center configuration graph; successful edges are checked against the original obstacle geometry. This is geometric simulation, with no physical dimensions, kinematics, controller or sensing measurements.

The [first registered controls and validation](data/footprint/disk-footprint-corridor-validation-01.json) use two9×7 layouts, A* FIFO and budget100. Width1 admits diameter0.8 in six moves but blocks diameter1.2; width3 restores the larger disk's six-move route. Exact diameter1 contact and diameter0.8 plus radial margin0.2 are blocked at width1. Six related controls agree with width reasoning and configuration BFS. Junmo then [chose margin0.15](data/learning/disk-clearance-choice-01.json) after AI explained it. The [selected model](experiments/disk-model-clearance015-01.config.json) requires width strictly greater than1.1. The [parameter check](data/footprint/disk-clearance015-validation-01.json) blocks width1 and admits width3 in six moves; margin0.05 still passes width1. This is a guided virtual parameter choice, not physical safety calibration.

**A feasible passage can disappear from the chosen graph.** Junmo [tentatively predicted passage at width2](data/learning/two-cell-doorway-expectation-01.json), reasoning that the body diameter is0.8. AI's [registered model-limit control](experiments/two-cell-doorway-01.protocol.json) preserves that geometry prediction separately from planner behavior:

| Same9×7 width2 map, diameter0.8, A* FIFO budget100 | Original cell-center search | Grid moves / examined nodes | Supplied continuous witness |
|---|---|---|---|
| Each-side margin0.05 control | ROUTE_FOUND | 6 / 7 | Valid, geometric length7 |
| Selected each-side margin0.15 | UNREACHABLE | null / 12 | Valid, geometric length7 |

The [raw/source-bound validation](data/footprint/two-cell-doorway-validation-01.json) identifies graph exhaustion, not a budget failure. At the doorway the original center samples have only0.5 clearance, below the selected effective radius0.55; the unsampled midpoint has clearance1. An axis-aligned world-coordinate witness passes through that midpoint. It proves feasibility here, not continuous shortest-path optimality. The [method and74-test archive](docs/TWO_CELL_DOORWAY_KR.md) distinguish grid moves from world distance, separate BFS/center/segment audits, the student's width expectation from the AI-proposed counterexample, and test/source provenance. These are two related cases on one known map, not independent samples.

Junmo then [selected offered option2](data/learning/two-cell-doorway-resolution-choice-01.json), adding intermediate candidates after AI explained the representation failure. AI implemented half-unit sampling with the original world, obstacle squares, body and margin unchanged. The [registered three-condition control](experiments/two-cell-doorway-resolution-01.protocol.json) on the same map gives:

| Candidate spacing / graph | Budget | Result | Edges / world length | Examined nodes |
|---|---:|---|---|---:|
| 1 / 9×7 | 100 | UNREACHABLE | null / null | 12 |
| 1 / 9×7 | 200 | UNREACHABLE | null / null | 12 |
| 0.5 / 17×13 | 100 | ROUTE_FOUND | 14 / 7 | 28 |

The [source-bound resolution validation](data/footprint/disk-resolution-validation-01.json) matches both coarse results to the archived failure, checks all candidate masks, matches the half-step path to BFS and validates every returned segment against original world geometry. Budget alone cannot repair this exhausted graph; adding the midpoint candidate recovers a feasible route here. It increases candidate count and does not demonstrate lower search work, runtime, storage or energy. World length equals edge count times spacing; the length7 result is shortest on this sample graph, not a global continuous optimum. The [method and79-test evidence](docs/DISK_RESOLUTION_KR.md) separate the student's direction choice from AI spacing/code/operation. These three conditions reuse one known map. To distinguish route recovery from the cost of finer representation, an [empty-map control](docs/OPEN_MAP_RESOLUTION_KR.md) keeps the same original9×7 world/endpoints/body/margin with no obstacles. Junmo [predicted before execution](data/learning/open-map-resolution-prediction-01.json) that half-step sampling would examine more positions, without a count or reason. At A* FIFO budget100, both find world length6: spacing1 uses6 edges/7 examined positions, spacing0.5 uses12 edges/13 examined positions. The [raw/source-bound validation](data/footprint/open-map-resolution-validation-01.json) separates total candidates63/221 from actual examined counts, preserves paths/BFS/segment checks and binds unchanged79-test sources without rerunning the full suite. This supports the direction on one known empty map, not a universal cost rule.

Junmo then [selected offered option2](data/learning/resolution-policy-choice-01.json): try the coarse graph first and refine once on exhausted UNREACHABLE. AI implemented that direction as a separate [reference policy](docs/RESOLUTION_POLICY_KR.md). Coarse success returns immediately; a budget failure or invalid endpoint stops without being mislabeled as graph disconnection. Refinement starts a fresh half-step search and retains the failed coarse stage. The [registered known-case replay](experiments/resolution-policy-controls-01.protocol.json) gives:

| Known layout | Always half-step: examined positions | Coarse first: all stage work | World length, both modes |
|---|---:|---:|---:|
| Empty | 13 | 7 | 6 |
| Width2 doorway | 28 | 12+28=40 | 7 |

The [source-bound validation](data/footprint/resolution-policy-controls-validation-01.json) matches all five executed stages to archived outcomes/masks and checks BFS, world paths, preserved failures and full costs. The staged policy avoids fine work on the empty map but adds a failed search on the doorway. Each stage has budget100; maximum policy allowances are100 for always-fine versus200 for coarse-first, explicitly not an equal-total-budget success study. These are four policy evaluations on two known layouts, not new independent samples. Path lengths agree here; coarse success is not a guarantee of the best fine-grid or continuous route. The next [hypothetical workload calculation](experiments/resolution-policy-mix-calculation.design.json) compares a stated mix before any claim about a real environment. Broader use needs a separately registered cohort. No runtime/energy/storage or physical improvement has been measured. Core point-planner results and the browser benchmark remain intact. Robot motion, differential-drive kinematics, waypoint control and sensing uncertainty remain future work; hardware dimensions and trials must be measured separately if equipment becomes available. [Research roadmap](docs/ROBOTICS_ROADMAP.md)

## Run and inspect

Requires Node.js 18 or later; no dependency installation is needed.

```sh
npm test
npm start
```

Open http://127.0.0.1:8080/ for the Korean demo. Source is in `src/`, inputs in `experiments/`, runners in `scripts/`, and tests in `test/`.

For deeper review: [algorithm notes](docs/ALGORITHM_REVIEW_KR.md), [engineering record](docs/ENGINEERING_REPORT.md), [assumptions and limitations](docs/RESEARCH_ARGUMENT.md), [data guide](data/README.md), and [repository workflow](docs/GITHUB_KICKOFF.md).
