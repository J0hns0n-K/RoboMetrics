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

## 2026-10-28 A* tie-breaking ablation — student qualitative position, AI alternative

- Student said equal-total candidates seem equivalent; exact response is preserved in `experiments/tie-break.protocol.json`. He did not select the alternative rule or predict a numerical effect. AI operationalized a separate question about expansions and budgeted success while retaining shortest-path quality.
- Source/protocol `260ac09d063c422b92acef8ad4a6afbb622429f7` was committed before full variant execution. Experimental inputs were clean; unrelated practice-file changes were retained and declared, so the entire workspace was not clean.
- Primary f=g+h, heuristic, movement, map cohorts, budgets, neighbors and goal handling are fixed. Only the equal-f secondary rule changes from FIFO to lower h (equivalently larger g at equal f), then FIFO. Default remains FIFO; extension and runner are AI-authored.
- All 720 historical A*/Greedy metrics reproduce. All 19 tests pass, including variant reachability/optimality checks on 1,024 4×3 obstacle layouts. Every successful A* result in the comparison matches reference length and has a verified path.
- Same 90 density-specific cohort entries reused in 360 paired map/budget comparisons; 720 A* variant calls plus 360 unchanged-Greedy compatibility replays and 90 reference checks. Do not add overlapping check counts or treat calls as independent maps.
- Planned representative condition .19/budget 120: successes 15/30→30/30. At budget 300 both complete on the same 30 maps: mean examined nodes 118.7667→36.9667, same mean moves 26.0667. Small 3×3 control: both 4 moves, examined nodes 8→5.
- Raw JSON/CSV, full paths for post-hoc first differing examples, TAP and artifact hash manifest are in `data/tie-break/`; all 12 conditions including gains/losses are in `docs/TIE_BREAK_RESULTS.md`. Effects are cohort-specific node counts, not runtime/energy, new algorithm invention or student code authorship. Student post-result interpretation pending.

## 2026-10-28 Guided browser result report

- After instructions to use the selected rule 2 with budget 120, click the 30-map comparison and report A*'s success count, Junmo replied verbatim: **30장(100%)**.
- Record this as a student-reported A* success count of 30/30. The instructed setting was closer-goal/budget 120; the full current settings, button operation and a new raw export were not independently observed in this event.
- Previously archived AI acceptance runs remain separate. This report does not create a new independently verified dataset or establish a general success probability.
- Next guided action: select rule 1 (FIFO), keep the other settings fixed, rerun the 30-map comparison and report the A* success count. Do not supply the expected count as the student's observation.

## 2026-10-28 Guided FIFO browser result report

- After instructions to select rule 1 (FIFO), retain budget 120 and all other settings, and rerun the 30-map comparison, Junmo replied verbatim: **15(50%)**.
- This is a self-reported A* success count of 15/30, compared with the earlier rule-2 report of 30/30. Full settings, operation and a new raw export were not independently observed; the two reports are not additional independently verified research datasets.
- The assistant's interpretation is limited to the reported condition: rule 2 found routes on more maps within the budget. It does not establish a universal ranking or a difference in shortest-path lengths.
- Next guided action: retain rule 1 and all map settings, change only the budget from 120 to 300, rerun and report A* successes. No outcome is attributed to the student before their reply.

## 2026-10-28 Guided higher-budget browser report

- After instructions to retain rule 1 and all map settings, increase only the budget from 120 to 300, and rerun, Junmo replied verbatim: **30(100%) -> 다음 할 것**.
- Record the A* count as self-reported 30/30 for the instructed FIFO/budget-300 condition. This follows the self-reported FIFO 15/30 at budget 120. Full settings, operation and a new raw export were not independently observed; archived AI checks remain separate.
- Assistant interpretation: the reported higher budget allows all 30 routes to be found in this comparison. A budget of 300 is a ceiling, not a measurement that every map used 300 examined nodes. No general success probability or student-authored explanation is inferred.
- Next task: retain the current report and read A*'s mean examined-node count across all maps, before changing the tie rule. Do not supply the expected value as a student observation.

## 2026-10-28 Guided reading of actual search work

- Asked for A* mean examined nodes in the existing rule-1/budget-300 report, Junmo initially supplied **26.07번 · 30장 기준**, the mean-moves row. After the assistant distinguished the labels and units, he replied **118.77칸**.
- Record 118.77 as the self-reported mean examined-node count across all 30 maps in the instructed FIFO/budget-300 condition. This reads another metric from the same report; it is not an additional run or independent dataset. Full settings and a new raw export were not independently observed.
- The assistant's explanation distinguishes actual mean work from the maximum allowance of 300 nodes. The student has not yet supplied a conceptual explanation in his own words.
- Next guided task: retain budget 300 and all map settings, select rule 2, rerun the 30-map comparison and report A* mean examined nodes. Its outcome must not be attributed before the student's response.

## 2026-10-28 Guided rule-2 search-work comparison

- After instructions to select rule 2 while retaining budget 300 and all map settings, rerun and report A* mean examined nodes, Junmo supplied **36.97칸**.
- This is a guided self-report for the instructed closer-goal/budget-300 condition, compared with the previous FIFO mean of 118.77. Full settings, the current success count and a new raw export were not independently observed. Do not count the report as a new independently verified dataset or infer a student explanation.
- Assistant calculation from the displayed means: 81.80 fewer examined nodes on average, approximately 68.9% lower. This is a scoped node-count comparison, not measured speed, energy or universal improvement. Archived AI-operated study results remain separate.
- Next guided task: keep the current settings/report, read A* mean moves and its successful-map denominator, and compare with the previously reported FIFO 26.07 moves across 30 successes. The new reading is pending.

## 2026-10-28 Guided rule-2 route-quality reading

- From the existing instructed rule-2/budget-300 report, Junmo supplied **26.07번 · 30장 기준** for A* mean moves and its successful-map denominator.
- Both rules' reported route-length means are 26.07 over 30 successful maps, while their reported mean examined-node counts are 118.77 (FIFO) and 36.97 (closer-goal). This completes the guided metric-reading comparison, not an independent replication. Full settings and a new export were not independently observed; raw AI-operated datasets remain separate.
- Assistant interpretation is scoped to the instructed cohort and displayed precision: the reported average route length is unchanged while examined nodes decrease. Equal means alone do not establish identical paths or map-by-map equality; the archived study has separate per-row checks.
- Next task: ask for the student's own one-sentence interpretation referring to both mean route length and examined-node count, limited to these 30 maps. Do not attribute the assistant's explanation as student reasoning.

## 2026-10-28 Student interpretation of paired metrics

After guided metric reading, the assistant's comparison table and explanation, Junmo was asked to interpret both metrics in one sentence, scoped to these 30 maps. He wrote verbatim:

> 1번 규칙 -> 2번 규칙으로 바꾸니까 길을 찾은 지도 수가 100%이고 평균 이동 횟수는 비슷한데 검토 칸 수가 확 줄었어

This is an elicited post-result interpretation, not an independent discovery or pre-run hypothesis. It recognizes route discovery, route length and search work together. Assistant clarification, kept separate from the quote: at budget 300 both rules succeed on 30/30 and both displayed mean route lengths are 26.07, while reported mean examined nodes differ, 118.77 versus 36.97. The increase from 15/30 to 30/30 belongs to the earlier budget-120 comparison. Do not infer a general guarantee, measured runtime/energy improvement or student code authorship. Browser readings remain self-reported; no new export has been inspected.

Next task: retain the current rule-2/budget-300 report and click JSON save to preserve its raw rows. No completed export is claimed before evidence arrives.

## 2026-10-28 Browser export located, archived and validated

- Junmo replied **저장됨** after the current rule-2/budget-300 JSON-save task. The assistant found the expected download, `robometrics-closer-goal-seed-20261027-budget-300.json`, and preserved the file byte-for-byte as `data/browser-reports/closer-goal-budget300-report-01.json`.
- Verified configuration: base seed 20261027, 16×12, density .19, 30 reachable maps, budget 300, closer-goal. A* has 30 successes, mean moves 26.066666666666666 and mean examined nodes 36.96666666666667.
- AI replay on the revision identified in the accompanying validation record exactly reproduces the entire benchmark payload after separating browser metadata. Accepted seeds and all 30 A*/30 Greedy metric rows match the earlier tie study. This is a validation replay of the same maps, not a new independent experiment.
- The validation record preserves the downloaded byte hash, browser timestamp and null browser source revision, validation revision/source hashes, dirty-workspace disclosure and operator limits. Verified file contents do not independently establish the physical click/operator or original browser execution revision. The user's save report and AI validation are separate contributions.
- Next proposed comparison: base seed 20262027, density .19, budget 300, both tie rules, 30 reachable maps. Ask for the student's expectation about examined-node counts before execution; no prediction or result has yet been supplied and no new-cohort run is claimed.

## 2026-10-28 New-cohort expectation registered before execution

- In response to the proposed new-cohort comparison, Junmo wrote **2가 적을 것 같아**. Preserve this as a directional expectation that closer-goal will have lower mean examined nodes, after exposure to the earlier cohort. No rationale, success-count prediction or route-length prediction was supplied.
- AI-authored protocol: `experiments/tie-break-validation-02.protocol.json`. Conditions: base seed 20262027, 16×12, density .19, budget 300, 30 reachable maps, FIFO first then closer-goal, same accepted maps and all other planning rules fixed.
- Primary comparison is the difference between all-map mean examined-node counts. Preserve failures and success denominators, compare common-success route lengths, and retain both browser exports for validation. Budget-capped means are not uncensored time-to-completion measurements.
- Previous matrix accepted seed IDs end at 20261083; new candidate IDs start at 20262028. This checks seed-ID separation without generating the new cohort and does not establish statistical independence or unique map layouts.
- At registration the assistant has not generated or run the new cohort; results are pending. Next user action: set the new base seed, retain density .19 and budget 300, select rule 1, run the 30-map comparison and report A* mean examined nodes. Do not fill expected numerical outcomes before the report arrives.

## 2026-10-28 New-cohort FIFO result reported

- After the registered FIFO instructions (base seed 20262027, density .19, budget 300, 30 maps), Junmo supplied **117.77칸** for A* mean examined nodes.
- This is a guided self-reported metric. Full settings, accepted seeds, success count, mean moves and raw rows have not yet been independently inspected. Rule 2 is pending; no support/rejection of the prediction or new-cohort replay is claimed.
- The in-progress record is `docs/TIE_BREAK_VALIDATION_02_RESULTS.md`; the pre-run protocol remains unchanged in commit `a859a3aa4c61abe804f92fb941222919e7a35220`.
- Next: save the current FIFO JSON before changing settings, then change only the tie rule to 2, rerun and report the same A* mean examined-node metric. Do not replace the cohort or provide a predicted numerical outcome.

## 2026-10-28 Rule-2 follow-up reported; FIFO raw file verified

- Junmo reported **33.80칸** after the rule-2 instructions on the registered new cohort. The displayed means are FIFO 117.77 and closer-goal 33.80, agreeing with his pre-run direction. The assistant's approximately 71.3% reduction calculation is preliminary and concerns examined-node counts only.
- The assistant located the expected FIFO download and archived its exact bytes in `data/browser-reports/fifo-seed20262027-budget300-report-01.json`. Its separate validation record preserves hashes, replay revision, sampling and provenance limits.
- Verified FIFO configuration matches the protocol: 20262027, .19, 16×12, 300, 30 maps. A* has 30 successes, mean moves 26 and mean examined nodes 117.76666666666667. Complete payload matches benchmark replay; all reference/metric rows and successful paths were checked. Sampling: 30 accepted out of 32 candidates, rejecting 20262039 and 20262057. Registered core/UI hashes match.
- This is AI validation of the downloaded cohort, not additional trials or independently observed browser operation. Rule-2 raw contents have not been inspected or replayed; accepted-seed matching, unchanged Greedy rows, rule-2 success count and common-success lengths remain pending.
- Next user action: retain the current rule-2 settings/report and click JSON save. Preserve that file before final paired validation. The registered protocol remains unchanged.

## 2026-10-28 Registered follow-up paired files validated

- Junmo replied **저장됨** after the rule-2 export task. The assistant located the expected download and preserved exact bytes as `data/browser-reports/closer-goal-seed20262027-budget300-report-01.json`.
- Paired validation record: `data/browser-reports/seed20262027-budget300-paired-validation-01.json`. Both full benchmark payloads reproduce, registered core/UI hashes match, all accepted seeds match, and Greedy rows are unchanged. All 30 reference and 60 A* metric rows were checked; successful A* paths are valid and shortest.
- Both rules succeed 30/30 with mean moves 26. Mean examined nodes: FIFO 117.76666666666667, closer-goal 33.8; exact reduction approximately 71.30%. Rule 2 examines fewer nodes on all 30 maps, with zero ties or regressions in this metric. Common-success path-length differences: zero; no claim of identical paths.
- The student's pre-run direction is supported on this cohort. This is not universal superiority, measured runtime/energy improvement or additional independent samples from replay. Sampling remains 30 accepted from 32 candidates, with rejected seeds 20262039 and 20262057. The pre-run protocol is unchanged.
- User reports and raw content checks are distinct: AI performed ingestion, replay and analysis; browser source revisions stay null and physical click/operator was not independently observed. Full methods and limits are in `docs/TIE_BREAK_VALIDATION_02_RESULTS.md`.
- Next proposed step: student selects and then designs a structured obstacle case (goal-side dead end or narrow corridor), followed by a scoped pre-run expectation. No choice, map or result is yet attributed to the student.

## 2026-10-28 Structured-map pattern selected, design pending

- Junmo replied **1번**, selecting a goal-side dead end from the two AI-proposed families. This selects a test pattern; it is not evidence of a complete independent map or algorithm design.
- AI prepared a 7×3 base layout with fixed endpoints and lower rows, and dead-end length options 2 and 4. Draft: `experiments/goal-side-dead-end.design.json`; worksheet: `docs/STRUCTURED_MAP_TASK_KR.md`.
- The student has not selected a length or made a pre-run prediction. The assistant did not call a planner on either candidate during preparation. Numerical outcomes remain unrecorded.
- Next student task: choose a dead-end length of 2 or 4 open cells to the right of S. Then record a scoped prediction and commit a finalized runnable scenario before comparison.

## 2026-10-29 Dead-end length selected before execution

- Junmo answered **4** to the offered 2-/4-cell length choice. The selected rows are `S....#G`, `.#####.`, `.......`; size 7×3, S at (0,0), G at (6,0).
- This is guided parameter selection within the AI-proposed layout. Preserve the distinction from independent full-map design or code authorship. The earlier new-cohort prediction does not automatically become a prediction for this map.
- Updated design and prepared `experiments/goal-side-dead-end-04.scenario.json` with status awaiting-prediction and prediction null. Planned comparison explicitly applies both A* tie options at the same budget 300; the original scenario runner evaluates FIFO only and cannot stand in for this paired comparison.
- No planner was called for the candidates or selected map during this update. Next student task: state whether rule 1, rule 2 or similar examined-node counts are expected, or indicate uncertainty, before the scenario is marked ready and executed.

## 2026-10-29 Structured-map expectation recorded before execution

- Junmo wrote **비슷할 것 같아** for the two A* rules' examined-node counts on the selected four-cell dead end. This is qualitative similarity; no numerical tolerance, exact-equality prediction or reason was supplied.
- Scenario changed to ready only after recording this expectation. Geometry and budget 300 remain fixed. The assistant has not called a planner on this selected map before recording/committing the forecast.
- AI will supply a paired fixed-map evaluator because the existing scenario runner uses FIFO only. It must explicitly apply both tie rules, validate paths and shortest lengths, and preserve failure reasons. Any implementation checks use previously known controls, not an unrecorded run of the selected map.

## 2026-10-29 Structured comparison executed on committed sources

- Qualitative forecast **비슷할 것 같아** was committed first in `5b3e4187de61173af4567ed66faddadad0d41707`. AI added `scripts/compare-fixed-ties.mjs` and three known-map integration controls; all 23 tests pass. The selected map was not a fixture in those tests.
- AI executed the ready scenario on source `e765e5b910c63bdfc5c2c38e35f3b482e74755e8`, with experimental inputs committed and unrelated practice-file changes declared. Core and original scenario runner remain unchanged.
- At budget 300 both A* rules succeed, return the same shortest ten-move path and examine 15 nodes. Saved examined nodes: zero. This is compatible with qualitative similarity; no exact-equality forecast or numerical equivalence tolerance is invented.
- One hand-constructed case shows no reduction here, limiting an always-fewer-node claim without establishing worse behavior or universal equality. AI explanation of primary f scores is separate from student reasoning; student post-result interpretation is still pending.
- Artifacts: `data/structured/goal-side-dead-end-04-run-01.json`, `fixed-tie-tests-01.tap`, `goal-side-dead-end-04-validation-01.json`. Full paths, forecast/source commits, canonical Git-blob hashes and roles are preserved. This is AI-operated synthetic validation, not student-run hardware work or a representative random sample.
- Next task: ask the student whether one may now claim rule 2 reduces examined nodes on every map, with a short reason scoped to the observed equal-count case.

## 2026-10-29 Student limits the universal improvement claim

After the result and AI explanation, Junmo responded to the universal-claim question:

> 2번은 모든 지도에서 검토 칸 수를 줄인다고는 못한다. 그 이유는 직전의 실험만 보더라도 칸수의 변화는 없었기 때문이다.

This is a guided post-result interpretation using the observed equal-count case to limit an always-fewer-nodes statement. Do not infer independent discovery, a worse-case example for rule 2 or universal equivalence. The original map, raw results and validation manifest remain unchanged.

AI prepared `experiments/goal-side-dead-end-one-wall.design.json`: choose wall A at (5,0) or B at (4,1), opening exactly one cell with dimensions, endpoints, other walls, budget 300 and search settings fixed. Student choice and a new prediction remain null. Neither revised candidate was evaluated; next action is the student's A/B selection before a separately committed scenario and forecast.

## 2026-10-29 Wall A chosen with a pre-run rationale

Junmo wrote:

> A를 없애는게 더 좋네. 왜냐하면 최단이동루트에는 A가 있고 B는 없어.

Record wall A at (5,0) as the selected edit and retain the original rationale. Assistant clarification is separate: A blocks the straight endpoint row and opening it creates that possible route; the original valid shortest path cannot pass through a wall. Do not silently rewrite this precision into the student's words or infer a numerical move-count/search-work forecast.

The draft and new `experiments/goal-side-dead-end-open-A.scenario.json` fix exactly one #→. edit. Other cells/endpoints, budget 300 and planning rules remain unchanged. The new input awaits a scoped numerical path-length expectation and has not been executed. Parent input, result and manifests stay unchanged. Next student task: predict the minimum number of moves after opening A.

## 2026-10-29 Six-move revision forecast recorded before execution

- Junmo answered with the number 6 followed by a backslash. The exact raw response is retained in the scenario; the trailing character is treated as extra text after the numeric minimum-move forecast of 6.
- Set the revised scenario ready only after recording that forecast. No examined-node count or tie-rule superiority expectation was supplied. Geometry, budget 300 and both A* options remain fixed.
- Commit the input before AI execution, then compare it with the unchanged parent artifact. Planner and evaluator sources are unchanged from the archived 23-test suite, so no new code tests are needed for this input/document revision.

## 2026-10-29 Committed wall-A revision executed and compared

- Forecast and ready input were committed first in `2ab94f7a51bbf1e204252adc8b85cd76479a94a6`. AI ran the unchanged paired evaluator once on the revised map. Full paths are in `data/structured/goal-side-dead-end-open-A-run-01.json`.
- Both rules succeed with 6 moves and 7 examined nodes, compared with the parent's 10 moves and 15 nodes. The normalized six-move forecast matches the result. Valid straight path meets the Manhattan lower bound of 6; source/path/geometry checks are in `goal-side-dead-end-open-A-comparison-01.json`.
- Controlled checks: exactly (5,0) changes #→.; all other cells, endpoints, dimensions, variants, budget 300, core and runner source hashes match. Parent input/results/manifests are unchanged. No new code test run: prior 23-test sources match, and the new input/path comparison is verified directly.
- AI interpretation distinguishes the environment edit from changing an algorithm rule: both improve under the same search policies. No measured runtime/energy, rule-2-specific gain or independently operated student experiment is inferred. Student post-result causal interpretation is pending.
- Next student task: explain the reduced moves and examined-node counts in one sentence referring to the condition that actually changed.

## 2026-10-29 Student explains A-removal change; B-only control prepared

After the results and AI explanation, Junmo answered the changed-condition question:

> 최소이동루트에 있는 장애물이 있었기 때문에 변화가 생길 수 밖에 없지

This is an elicited post-result explanation attributing the change to the obstacle. Preserve the wording separately from the assistant's clarification: A blocked a potential straight route, not a cell on the original valid path. The statement is scoped to this case, not a proof that any wall removal must reduce path length or examined nodes, and not a detailed explanation of search order.

AI proposed the next B-only control in `experiments/goal-side-dead-end-open-B.scenario.json`: return to the original parent with A blocked and open only (4,1). Budget 300 and other cells/rules remain fixed. This is not a cumulative A+B opening and is not attributed as a new student wall selection. No planner was called for this control. The next forecast concerns FIFO examined nodes relative to the original 15; no closer-goal or route-length forecast is inferred.

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
