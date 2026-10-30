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

- **Checks:** the latest [suite archive](data/footprint/resolution-prospective-tests-01.tap) records 101 passing tests in test/*.test.mjs, including four matched-comparison controls; [validation](data/footprint/resolution-quality-prospective-validation-01.json) binds exact test/source/input hashes. Earlier archives retain their source-bound results. Existing audits check 1,024 small layouts against separate BFS, replay historical policy metrics, and test budget/resume/bound correctness; these controls are not independent research samples.
- **Evidence:** [protocol](docs/EXPERIMENT_PROTOCOL.md), [raw baseline data](data/batch/), [raw tie-rule data](data/tie-break/), source revisions, hash manifests and [experiment log](docs/EXPERIMENT_LOG.md) support the numerical claims.
- **Attribution:** the initial scaffold and subsequent implementation, automated tests and archived batch execution are AI-authored or AI-operated. Junmo's documented contributions include guided choices, parameter edits, a manually supplied shortest route, interpretations and the demo-default choice. The [contribution log](docs/CONTRIBUTION_LOG.md) separates these roles; this overview is AI-assisted writing.
- **Limits:** static, fully known, four-connected unit-cost grids. Early random comparisons sample reachable parent maps; the later unfiltered body-policy cohort retains every generated map, including invalid endpoints and disconnected graphs. The disk model is assumed geometry, not motion dynamics or measured hardware. Tie-breaking is established prior work; these results do not establish a universal winner or physical robot performance.

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

Junmo [reports no robot available yet](data/learning/robot-hardware-context-01.json). The model uses an assumed circular body, closed unit-square obstacles and forbidden contact in virtual units. [Initial geometry controls](data/footprint/disk-footprint-corridor-validation-01.json) showed that body size changes which point-planner paths are feasible. Junmo then [selected the offered0.15 clearance](data/learning/disk-clearance-choice-01.json); with diameter0.8, the [selected model](experiments/disk-model-clearance015-01.config.json) has effective radius0.55. This is a geometric assumption, not measured hardware or physical safety calibration.

**Representing a feasible route matters as well as finding one.** Junmo [tentatively expected passage through width2](data/learning/two-cell-doorway-expectation-01.json). The [known control](docs/TWO_CELL_DOORWAY_KR.md) supports that width expectation with a continuous geometric witness, while the original cell-center graph reports UNREACHABLE. Intermediate half-step candidates [recover the route](docs/DISK_RESOLUTION_KR.md) without changing the world, obstacles, body or margin. This does not establish continuous shortest-path optimality. An [empty-map control](docs/OPEN_MAP_RESOLUTION_KR.md) then supports his guided prediction of greater half-step work on that map:7 versus13 examined positions at equal world length6.

Junmo [selected coarse-first refinement](data/learning/resolution-policy-choice-01.json) from AI-offered options. AI's separate [reference policy](docs/RESOLUTION_POLICY_KR.md) returns a coarse success immediately and retries once at half-step only after exhausted coarse UNREACHABLE. Budget failure and invalid endpoint clearance remain distinct. The retry is a fresh search; all stage work is retained:

| Known layout | Always half-step: examined positions | Coarse first: all stage work | World length, both modes |
|---|---:|---:|---:|
| Empty | 13 | 7 | 6 |
| Width2 doorway | 28 | 12+28=40 | 7 |

These [source-bound known controls](data/footprint/resolution-policy-controls-validation-01.json) motivate a workload trade-off. A [hypothetical reweighting](data/footprint/resolution-policy-mix-validation-01.json) changes which policy has a lower total when the frequency of just those two layouts changes. That arithmetic is AI support after a guided student direction response; it adds no new maps and measures no actual workload.

**Fresh inputs also expose losses hidden by the known controls.** Junmo [chose to retain failures](data/learning/resolution-followup-scope-choice-01.json). AI froze the [new generation protocol](experiments/resolution-policy-unfiltered-01.protocol.json) before generating exactly30 maps:9×7, wall probability0.15, seeds20267028–20267057, S(1,3)/G(7,3), selected body/margin, A* FIFO. The two point endpoint cells are free; neighboring walls are retained. No maps are filtered, refilled or replaced.

The [raw/source-bound validation](data/footprint/resolution-policy-unfiltered-validation-01.json) reports the same status counts for both policies:7/30 routes,3/30 sample-graph UNREACHABLE,20/30 invalid body-clearance endpoints and0/30 budget failures. Only10 maps have valid endpoints; unbudgeted reference BFS labels7 fine-graph reachable and3 unreachable. The conditional7/10 must not replace the primary7/30 denominator. A free point cell need not fit the assumed body and clearance.

| Same30 maps, all failures retained | Total examined positions | Actual planner calls | Mean world length on the same7 successful maps |
|---|---:|---:|---:|
| Always half-step, archived | 281 | 10 | 58/7 ≈8.29 |
| Coarse first, archived | 280 | 17 | 60/7 ≈8.57 |
| Quality-checked, same-data replay | 332 | 19 | 58/7 ≈8.29 |

The table combines the two archived arms with the subsequent quality replay described below. Twenty endpoint-invalid maps do no search; the original valid-endpoint mean work is28.1 versus28.0 over10 maps. On5 of7 jointly successful maps lengths agree. On trials12 and23, coarse first stops at world length8 while always-fine finds7. One fewer examined node, seven extra planner calls and two longer returns do not establish a policy advantage. The [method/results](docs/RESOLUTION_UNFILTERED_01_KR.md) retain every failure, reference mask, path and stage and explain the90-test/source/geometry/BFS audit.

Each stage has budget100, giving maximum allowances100 direct versus200 staged/quality-checked; this is not a general equal-total-budget success study. Node counts omit model construction, validation, reference and storage costs. A seed-fixed synthetic condition does not prove statistical independence, represent a real workload or establish universal policy/continuous-motion performance. Models/code/operation/initial analysis are AI support; the student's scope choice is not an outcome forecast or independent implementation.

Junmo [selected the offered shortening objective](data/learning/resolution-path-quality-choice-01.json). AI's new [quality policy](docs/RESOLUTION_QUALITY_REPLAY_KR.md) skips a coarse path already at the axis-Manhattan lower bound; otherwise it checks one fine route and preserves a valid coarse fallback if optimization times out. On the same development cohort, the [source-bound replay](data/footprint/resolution-quality-replay-validation-01.json) shortens both observed8-unit paths to7 and preserves7/30 successes, adding52 examined positions:280→332. The successful mean now matches archived always-fine58/7, at greater work than its281. This repairs the observed length loss, not computational efficiency. No new maps were generated and the archived comparison arms were reused rather than rerun.

A separate fine-budget1 control retains the valid8-unit path with top-level ROUTE_FOUND while preserving optimization BUDGET_EXCEEDED, raw empty/null failure and total work13. Route validity is distinct from optimization completion. Student contribution is the guided objective choice; the bound/rules/code/tests/operation/initial analysis are AI support. Trial12 was selected after seeing the baseline and the replay is not held-out evidence. After the comparator clarification, Junmo [accepted the guided criterion](data/learning/resolution-priority-criterion-01.json): prefer shorter valid routes, then lower examined work when lengths tie. This is a declared comparison criterion, not a new algorithm or a universal policy winner. The [prospective protocol](experiments/resolution-quality-prospective-01.protocol.json) fixed new seeds20268028–20268057 under the same9×7/.15 generator before generation; policy/generator hashes were unchanged. Junmo [predicted option2](data/learning/resolution-prospective-prediction-01.json), lower quality-checked total work on maps where both return equal lengths, without a reason or count.

The [source-bound prospective results](data/footprint/resolution-quality-prospective-validation-01.json) retain all30 maps: both policies return2/30 routes,4/30 graph-unreachable outcomes,24/30 invalid endpoints and0/30 budget failures. Only6 endpoint-valid maps receive reference BFS; the two jointly successful maps return equal lengths9 and7. On that prespecified matched2-map subset, always-fine examines63 positions versus quality-checked89, so the direction is not supported on this condition. Primary all-map totals are130/165 and are not substituted for the forecast's matched denominator. Failures are not ranked as cheap wins.

The prospective failures raised a geometric question: can a free goal cell still be unsuitable for the assumed body? An [AI-reference endpoint control](docs/ENDPOINT_PLACEMENT_CONTROL_KR.md), registered under a [committed protocol](experiments/endpoint-placement-controls-01.protocol.json), keeps archived trial10, its obstacles/start, radius0.4/margin0.15, FIFO and stage budgets fixed while changing only the goal. The [source-bound control](data/footprint/endpoint-placement-controls-validation-01.json) rejects originalG and B before search; the AI-explained A admits a9-unit fine path with38 examined positions, versus2+38 for the staged policy. These are known input variants, not new independent maps, and the original30-map failures remain preserved.

Student-selected input revisions connect that distinction to a practical failure response. Junmo chose(8,4), then(6,1) after the clearance explanation, saving each one-line input. The [first AI check](data/learning/endpoint-student-choice-run-01.json) rejects boundary/obstacle clearance, while the [revision](data/learning/endpoint-student-choice-run-02.json) returns world length8/examined31 on the same trial10/body/always-fine/FIFO/budget200 condition. He [attributed the failed placement to insufficient space](data/learning/endpoint-student-interpretation-01.json); detailed geometric diagnosis remains AI support. After uncertainty on writing a user message, AI supplied the wording and conditional display. [Functional controls](data/learning/endpoint-feedback-validation-01.json) and separately preserved [guided user reports](data/learning/endpoint-feedback-student-report-02.json) cover warning appearance for the invalid goal and absence for the valid goal. This changes communication, not the planner, goal automatically, or the failed original cohort.

To describe a path before adding a motion model, the project now separates world length from direction changes. Junmo [counted1 and5 changes](data/learning/path-turn-count-answer-01.json) on two offered six-step sketches and [designed `↓→→→↓↓`](data/learning/path-turn-design-validation-01.json), verified as six moves with two changes. AI implemented the [direction-change descriptor](docs/PATH_DIRECTION_METRIC_KR.md): the [source-bound known-case check](data/learning/path-direction-metric-run-01.json) adds6 changes to the existing goal(6,1) route of world length8/examined31, while a failed route receives `null`. Initial orientation alignment is excluded, and subdivision into half-steps does not add direction changes. These are geometric descriptors, not rotation time, energy or motion-feasibility measurements.

An explicitly assumed cost makes route preference depend on the chosen model. The [fixed X/Y score check](data/learning/path-turn-score-run-01.json), under its [protocol](experiments/path-turn-score-01.protocol.json), gives X(length6/changes5)=16 and Y(length8/changes2)=12 at distance weight1/change weight2. Junmo calculated those values, selected Y, and then [recalculated X8.5/Y9 and selected X](data/learning/path-turn-cost-sensitivity-answer-01.json) at change weight0.5. His [verified one-line edit](data/learning/path-turn-score-edit-01.json) preceded the [AI-run paired check](data/learning/path-turn-score-run-02.json), which preserves both conditions and the original artifact. Paths and descriptors stay fixed; only the assumed coefficient changes. He [interpreted the reversal as giving direction changes less importance](data/learning/path-turn-cost-interpretation-01.json). AI supplied the fixtures, weights, score code and execution. These are arbitrary-point comparisons of two offered paths, not calibrated travel cost or global optimality.

Rotation magnitude and starting orientation expose a further limit of event counts. Junmo [answered90/180degrees](data/learning/heading-angle-answer-01.json) for right-to-down/right-to-left alignments; AI implemented a [separate rotation descriptor](docs/PATH_ROTATION_KR.md). On the same schematic X/Y paths, the [initial-right controls](data/learning/path-rotation-run-01.json) give X total450degrees and Y270degrees. For initial down, he [calculated initial alignment X90/Y0](data/learning/path-rotation-initial-heading-answer-01.json) and saved a [verified one-line edit](data/learning/path-rotation-edit-01.json). The [new configured check](data/learning/path-rotation-run-02.json), under its [protocol](experiments/path-rotation-02.protocol.json), gives X initial90/internal450/total540degrees and Y initial0/internal180/total180degrees. Fixed paths and internal turns are unchanged; initial alignment accounts for the difference. This forward-only in-place-alignment geometry leaves the existing event/score/search definitions intact.

The current extension is an [ideal nominal-duration proxy](docs/NOMINAL_PATH_TIME_KR.md), not a timed controller or hardware result. At AI-assumed linear speed1virtualcell/s and angular speed90degrees/s, with initial down and sequential translation/rotation, `nominal seconds = world length / linear speed + total rotation degrees / angular speed`. Junmo [hand-calculated X12/Y10](data/learning/path-nominal-time-answer-01.json); AI implemented the helper, exercise and checks. The [source-bound execution](data/learning/path-nominal-time-run-01.json), under its [protocol](experiments/path-nominal-time-01.protocol.json), records the components below. Twelve focused tests pass: six new duration tests and six existing rotation tests; the old101 suite was not repeated. Independent path/heading/rate arithmetic agrees, with no new planner calls, BFS or maps.

| Fixed schematic path | World length | Total rotation, initial alignment included | Nominal translation | Nominal rotation | Nominal total |
|---|---:|---:|---:|---:|---:|
| X | 6 | 540degrees | 6s | 6s | 12s |
| Y | 8 | 180degrees | 8s | 2s | 10s |

The rates are uncalibrated assumptions with instantaneous rate changes; acceleration, slip, tracking, sensing and collision feasibility are not validated. Nominal seconds are not measured travel duration or elapsed program time. No existing score/search objective changes, and no globally fastest path is established. Next is [student recalculation at angular speed180degrees/s](experiments/path-nominal-time-angular-speed-01.design.json), before that condition is edited or run. Core point-planner/browser results remain intact; differential-drive dynamics, control, sensing and physical measurements remain future work. [Research roadmap](docs/ROBOTICS_ROADMAP.md)

## Run and inspect

Requires Node.js 18 or later; no dependency installation is needed.

```sh
npm test
npm start
```

Open http://127.0.0.1:8080/ for the Korean demo. Source is in `src/`, inputs in `experiments/`, runners in `scripts/`, and tests in `test/`.

For deeper review: [algorithm notes](docs/ALGORITHM_REVIEW_KR.md), [engineering record](docs/ENGINEERING_REPORT.md), [assumptions and limitations](docs/RESEARCH_ARGUMENT.md), [data guide](data/README.md), and [repository workflow](docs/GITHUB_KICKOFF.md).
