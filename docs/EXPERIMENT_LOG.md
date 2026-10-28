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

## 2026-10-27 guided exercise 02 — detour prediction

- AI supplied the complete 5×3 obstacle map; Junmo's exact prior answer was `8`. This is a numerical prediction, not student map design or a student-written algorithm.
- Both input files and the prediction note were committed before execution: `9aed8478d02ac5ce0e08448333400cacfc375771`.
- Matched control: same 5×3 dimensions, start (0,0), goal (4,0), four-neighbor movement and unit step cost; only obstacles differ. The AI supplied the control and its four-move prediction.
- AI selected budgets 5/8/9/15 and operated both runs. Outputs were initially staged under ignored `.git/evidence/` so the two executions used clean source, then copied unchanged into tracked data files.
- Raw: `data/guided/task-02-open-run-01.json` and `data/guided/task-02-detour-run-01.json`; complete paths, budget failures, source/input hashes and environment included.
- All three algorithms found 4 moves on the open control and 8 on the obstacle map. The student's prediction matched the latter. A*/Greedy expansions were 5/5 on the control and 9/9 on the detour. Dijkstra expansions were 10 and 9 respectively.
- At budget 8 the detour run fails for all policies; at budget 9 all succeed. This convention includes examining both start and goal, so 8 moves can require 9 examined nodes.
- AI interpretation: the matched obstacle map adds 4 moves. The wall in column 1 forces a visit to the bottom row; returning to the goal row requires two upward moves. Four net rightward moves plus two down and two up gives a lower bound of 8, achieved by the returned path.
- No student route explanation or post-result interpretation has yet been supplied for this exercise. Neither exercise establishes a Greedy path-quality counterexample or general algorithm ranking. Search-engine code is unchanged; no new test-suite run was needed for input/document-only additions.

## 2026-10-27 guided exercise 03 — student-selected wall removal

- Student's exact prior response: `1번 벽/4번`. Junmo selected wall 1 at (1,0) for removal and predicted four moves. AI supplied the numbered-map task; the student's explanation was supplied after results, as recorded below.
- Scenario and prior prediction committed before execution: `9ef0caf4d43b0a75da317ca335de57cf1fa72d27`. AI operated the runner on that clean source; staged output under ignored `.git/evidence/`, then copied it unchanged into the data directory.
- Raw: `data/guided/task-03-run-01.json`; comparison: `data/guided/task-03-comparison.json`. Baseline is the unchanged `task-02-detour-run-01.json`.
- Comparison checks confirmed only (1,0) changed from `#` to `.`, dimensions/endpoints and budgets 5/8/9/15 match, and engine/runner hashes match across the different input commits.
- Unlimited path length changed from 8 to 4 for all three policies. Examined nodes changed A*: 9→5, Greedy: 9→5, Dijkstra: 9→9. All raw paths and budget trials are preserved.
- AI explanation: the opened top row permits four rightward moves, matching the four-column separation lower bound. The student selected the environment revision and prior numerical prediction; AI transcribed it, operated software, and wrote this explanation.
- Student explanation after results and AI discussion, verbatim: **그 1번 벽이 최소 이동 루트를 막고 있었어. 다른 벽들은 그 최소 이동 루트에 관여하지 않았고**. This correctly identifies wall 1 on the direct top-row route and the remaining walls outside it for this layout. It is an elicited post-result explanation, not a pre-execution rationale or a general claim about other maps.
- This verifies a guided map revision, not an algorithm-code improvement or a Greedy path-quality counterexample. No implementation files changed, so the existing test suite was not rerun; the new input, returned paths and controlled comparison were checked.

## 2026-10-28 AI reference counterexample — Greedy path quality

- AI selected seed 260 on a 5×5 grid at generation density .28 after inspecting results. Full size/seed search order and selection criteria are in `docs/COUNTEREXAMPLE_01_KR.md` and the fixture. This is post-hoc teaching-case selection, not an independent sample for estimating a general effect.
- Fixture and tests were committed in `87ae90e391d36a72d62c78827664c6bf288172ee` before the documented reproduction; original discovery outcomes were already known.
- AI-operated reproduction on clean source: `data/reference/greedy-detour-run-01.json`. A* returns 8 moves/20 examined nodes; Greedy 12 moves/14 nodes; Dijkstra 8 moves/20 nodes. Every returned route is valid. An actual eight-move route matches the Manhattan lower bound, establishing the optimum on this map independently of agreement between A* and Dijkstra.
- At budget 14 Greedy succeeds and A* exceeds budget; at 20 both succeed, with different path lengths. Preserved all budget outcomes at 8/14/20/25.
- All 13 tests passed; raw TAP and validation manifest are preserved beside the run. The original search engine is unchanged.
- AI prepared a path comparison using raw returned coordinates. No student discovery, prediction, implementation, observation response or interpretation is claimed for this case yet.

## 2026-10-28 student-supplied alternative path — unchanged counterexample map

- Instead of selecting a wall for removal, the student supplied down 3/right 2/down 1/right 2 and stated that an eight-move route already exists. Exact response and move groups were committed in `004deec939bdd10bebb3871c66ee44410557b0f6` before AI verification.
- AI reconstructed the route and verified it on the unchanged seed-260 map. Length is 8, the route is valid, and it attains the independent Manhattan lower bound of 8. It is a different route from the originally displayed A* path, also optimal.
- AI also checked all 32 subsets of the existing five walls removed: the route remains valid and the lower bound remains 8. This is deterministic finite verification of this layout/removal scope, not independent repeated trials or a claim about arbitrary obstacle placement.
- Raw route, hashes, proof rationale and removal checks: `data/guided/task-04-route-check.json`, on clean source `004deec939bdd10bebb3871c66ee44410557b0f6`. Reference engine hash matches the original counterexample run.
- Student contribution: proposed route and the observation that removing a wall is unnecessary for the existence of an optimal path, after the guided comparison. AI contribution: supplied original example, transcribed coordinates, operated verification and wrote the formal lower-bound/scope explanation. No algorithm implementation change or original counterexample discovery claimed.
- The key distinction is existence of an optimal route (8) versus the route the unchanged Greedy implementation selected (12). Further work can use the unchanged map to compare algorithms without altering the environment.

## 2026-10-28 full reference-protocol matrix — recorded student input, AI operation

- Student initially expected A* to provide shorter routes, based on prior examples, while saying the meaning of success frequency was unclear. After clarification, the exact success-frequency response was `아직 모르겠어`. Both responses are preserved in the protocol; there is no directional success-frequency hypothesis to reject.
- Source/protocol commit before execution: `2dda59173bfc99ce0c9ad418f3724edf621d6a1e`; clean workspace, Node v24.22.1, Windows x64. Original core hash unchanged. All 16 tests passed.
- Conditions: three generation densities .12/.19/.28 × budgets 75/120/180/300, 30 solvable maps per density, 16×12, base seed 20261027. Same maps within each density across policies and budgets. 90 density-specific cohort entries reused for 360 map/budget pairs and 720 A*/Greedy runs; these are not independent 360 maps or 720 trials.
- Raw JSON/CSV, TAP, SHA256 manifest: `data/batch/`. Full table: `docs/MATRIX_RESULTS.md`. Rejected candidates: .12=0 of 30 checked, .19=4 of 34, .28=26 of 56. Reachable-only selection remains a validity limit; accepted cohorts can differ between densities.
- Example at .19/budget 120: A* succeeds 15/30, Greedy 30/30. On the shared 15 successes, mean moves are 26 vs 27.6. At .19/budget 300, both succeed 30/30; mean moves 26.0667 vs 28.4 on the same 30 maps. Per-policy success-conditioned means are also retained with explicit denominators, not treated as identical subsets when rates differ.
- Three AI-selected post-hoc case reports preserve full paths and matched metrics: seed 20261028/.12/budget 75 (A* budget failure, Greedy succeeds at 26 moves); seed 20261046/.28/budget 300 (A* 26 moves, Greedy 40); the same dense seed at budget 75 (both budget failures despite reference reachability). Additional replays are validation, not new independent trials.
- Matrix tooling, audit, operation and initial numerical interpretation are AI support. Student expectation/uncertainty is actual pre-run input. After the results and explanation, the student stated that shorter routes and finding routes on more maps differ under calculation limits; the verbatim response and AI wording clarification are preserved in `MATRIX_RUN_KR.md`. This is a guided post-result interpretation, not a pre-run forecast or independent implementation/execution. FIFO tie-breaking, finite budgets, conditional selection and success-conditioned summaries limit generalization. No physical performance measured.

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
