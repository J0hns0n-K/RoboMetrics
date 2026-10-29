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

## 2026-10-29 B-control forecast recorded before execution

- Asked about FIFO examined nodes relative to the original 15, Junmo replied **같을 것 같아**. Interpret this as unchanged relative to the prompt-provided 15; do not claim an independent numerical calculation or infer a reason.
- No closer-goal or route-length expectation was supplied. B remains an AI-proposed follow-up control, not a newly student-selected wall.
- Record the forecast and ready input before execution. The original map has A blocked; only B=(4,1) opens. Core/evaluator and budget 300 remain unchanged. Full-suite tests are not repeated for this input-only revision; new geometry/paths and before/after controls will be checked directly.

## 2026-10-29 B-only control executed; unchanged-work expectation not observed

- Ready input and forecast **같을 것 같아** were committed in `c7303a97b10fa0509ad004b0f3405381fce3ce6c` before AI execution. Raw result: `data/structured/goal-side-dead-end-open-B-run-01.json`; controlled comparison: `goal-side-dead-end-open-B-comparison-01.json`.
- Both rules succeed with 10 moves. FIFO examines 16 rather than 15 nodes; closer-goal examines 12 rather than 15. The scoped unchanged-FIFO forecast is not borne out; no closer-goal or route-length forecast was supplied. These are not route-discovery failures.
- Verified exactly B=(4,1) opens on the original map, A remains blocked, all other cells/endpoints, budget 300, variants, core and evaluator hashes match. Parent/A files remain unchanged. Successful paths are valid. A barrier-column lower bound of 10 plus a valid ten-step witness independently checks shortest length.
- Core/parser/evaluator/test code is unchanged from the archived 23-test suite, so full-suite tests were not repeated. New geometry, paths, forecast commit and before/after controls were checked directly and recorded with provenance.
- Initial interpretation is AI-authored: fewer walls do not guarantee fewer examined nodes for this FIFO implementation; unchanged shortest length does not force unchanged search work. One constructed map pair does not estimate general effects, runtime/energy or physical robot performance. Student post-result interpretation remains pending.
- Next task: ask the student, using these counts, whether one can claim wall removal always reduces examined-node counts.

## 2026-10-29 Student interprets both directions; evidence synthesis begins

After the B-control results and assistant explanation, Junmo replied:

> 반드시 주는 건 아닌 것 같아. 아까 실험을 보면 오히려 증가한 칸 수도 있고 너 말대로 줄어든 것도 있고

Retain the original wording. This is a prompted post-result interpretation that wall removal does not necessarily reduce examined nodes, reflecting FIFO's increase and closer-goal's decrease. The reference to the assistant's explanation is retained; do not infer independent counterexample discovery or a detailed mechanism explanation. Predictions and raw results stay unchanged.

AI prepared `docs/ENGINEERING_SUMMARY_KR.md`, linking both random cohorts, the original/A/B controlled cases, registered expectations and actual outcomes, including the unchanged-FIFO expectation that was not observed. It distinguishes student quotes from AI implementation, execution and editing. Next task: the student's current research-question sentence for the synthesis; any new wording is retrospective framing, not an original preregistered hypothesis.

## 2026-10-29 Student-formulated failure-output question

In response to the open request for a current research question, Junmo wrote:

> 종착지까지 무슨 짓을 해도 갈 수 없을 때 결과값이 어떻게 나오는지 궁금해

Record this as a new question after earlier experiments, not a backdated hypothesis or a supplied outcome forecast. AI prepared `experiments/unreachable-goal.scenario.json`: a 3×3 map isolating G, with budgets 2 and 300 fixed before execution. AI's API expectations are labeled separately from the student's question. The normal 30-map benchmark selects reachable maps, so a separate fixed case is required. Verify exhaustive disconnection independently and distinguish UNREACHABLE from budget exhaustion; core and runner code remain unchanged.

## 2026-10-29 Failure-output example executed and independently checked

- AI committed the example and expectations in `d52a8ac2242c510d015e77b203b6a195d014dc53`, then ran the unchanged scenario helper. The student's question is not recorded as an outcome prediction.
- For A* FIFO, Greedy and Dijkstra, unlimited and budget-300 runs return success=false, UNREACHABLE, empty paths and null path lengths after six examined nodes. Budget 2 instead returns BUDGET_EXCEEDED after two examined nodes for all three.
- Independent queue traversal over the input grid characters, without calling the planner or makeMap, finds six start-connected cells and excludes G. Goal is isolated by two walls and boundaries. The original 23-test core/runner sources match; input/output fields and reachability were checked directly without a full test rerun.
- Raw output and hashes/provenance: `data/failure-semantics/unreachable-goal-run-01.json` and `unreachable-goal-validation-01.json`. Full explanation: `docs/FAILURE_SEMANTICS_KR.md`.
- Sufficiently exhaustive failure confirms no route under the declared fixed map/rules; budget exhaustion alone does not certify that. Null length means no returned route, not zero moves. This fixed negative case stays outside the random benchmark's reachable-only cohort.
- Next task: student explains why the two failure reasons must be distinguished. No such student interpretation has yet been received.

## 2026-10-29 Student interpretation; connected control prepared

After the failure explanation, Junmo wrote:

> 도착 불가는 예산 초과가 없더라도 절대 값이 나올 수 없어.

Preserve this wording and distinguish the assistant's clarification: no successful route exists under the fixed map/rules, but the API still returns a failure object. Do not infer that the student fully distinguished successful-path output from any return value or already explained the budget-exhausted case.

AI prepared `experiments/reachable-goal-budget-control.scenario.json`: open only (1,2), immediately left of G, keep the upper goal wall blocked and hold endpoints, other cells, code and budgets 2/300 fixed. This makes a connected contrast to the disconnected example. No planner called for this control; input awaits a student prediction for A* FIFO's budget-2 status only. Parent input/raw output and validation remain unchanged.

## 2026-10-29 Connected-control status forecast recorded

- Junmo answered **예산 초과** for A* FIFO at budget 2 on the connected map. This is a guided pre-run status prediction after API explanation, not an independent discovery or a forecast for the other algorithms/budgets.
- Record BUDGET_EXCEEDED as the mapped status and commit the ready input before execution. No numerical route length was supplied. Geometry opens only (1,2), retaining the upper goal wall and budgets 2/300.
- Use the unchanged existing runner and verify the single-cell comparison, independent connectivity, returned fields and successful paths. No code change or full-suite rerun is required for the input-only example.

## 2026-10-29 Connected control executed; small-budget status matches

- Ready input and **예산 초과** forecast were committed in `93491c1ef104df472356278820c2a937600388f5`, then AI ran the unchanged scenario helper. Raw result: `data/failure-semantics/reachable-goal-budget-control-run-01.json`; paired proof: `reachable-goal-budget-control-validation-01.json`.
- At budget 2 the connected map returns BUDGET_EXCEEDED for A* FIFO, Greedy and Dijkstra, matching the student's scoped FIFO forecast. At 300 all return valid four-move paths; examined nodes are 8, 6 and 8 respectively. The original disconnected map returns BUDGET_EXCEEDED at 2 and UNREACHABLE at 300.
- Verified only (1,2) opens, upper goal wall remains, endpoints/other cells, budgets and core/runner source hashes match. Independent grid BFS finds 8 connected cells including G and shortest goal distance 4. Failure paths remain empty/null and successful paths are valid. Original artifacts remain immutable.
- No code change or full-suite rerun; prior 23-test source equivalence and new input/path/field checks are recorded. AI supplies the initial interpretation: a cutoff alone cannot certify disconnection because it occurs on both maps. This is not a student implementation, physical result or extra independent sample from validation.
- Next student task: explain in one sentence, citing the successful high-budget run, why budget exhaustion alone cannot establish no route. That post-result interpretation is not yet supplied.

## 2026-10-29 Student explains why a cutoff does not certify no path

After the matched results and explanation, Junmo wrote:

> 길이 있는데도 검토 예산을 줄이면 예산 초과가 떠 버리니까 그것만 보고 길이 없다고 단정하면 안되지

Record this as a guided post-result interpretation supported by the connected map's budget-2 failure and budget-300 success. It is not independent API design, algorithm implementation or experiment operation. Raw results, source revisions and predictions remain unchanged.

AI prepared `practice/03-failure-reason.mjs`, an intentionally incomplete exercise reading the four archived A* map/budget cases without invoking a planner. Student task: choose the failure-reason field name in one placeholder and save. Function branches, messages and file loading are AI-authored. No student edit, save or exercise execution is yet confirmed; the prospective one-field edit must not be labeled an independent classifier implementation.

## 2026-10-29 Guided field edit observed, committed and exercised

- User reported **저장됨**; direct diff confirms only `const fieldName = '____';`→`const fieldName = 'reason';` in `practice/03-failure-reason.mjs`. All other scaffold code matches the AI-provided version. The edit was recorded first in `3bd0cf1828c0f4855a7a58e378b94086bcae8863` by the AI recorder.
- AI executed the committed practice file and read the four archived A* results, without invoking a planner. Both budget-exceeded cases, despite different map connectivity, share a classification; unreachable and success have their own classifications. No unclassified result remains.
- Record: `data/learning/practice-03-run-01.json`; exact output: `.stdout.txt`. Source/blob/data/output hashes, actual diff scope, operator and checks are retained. Existing source datasets are unchanged and no new independent map trial or full-suite test run is claimed.
- Student contribution is the guided one-field choice and actual save. Function, conditional branches, messages, file loading and execution/validation are AI support, not student implementation of a new classifier or algorithm. Production core and UI remain unchanged; unrelated practice-02 edit was not staged.
- Next student task: explain why success=false alone cannot distinguish budget exhaustion from unreachable failure, whereas reading the failure-reason field can. That rationale is not yet received.

## 2026-10-29 Student explains the reason-field choice

Asked why the reason field is needed when both failure types have success=false, Junmo wrote:

> 그게 예산 초과 때문인지 아니면 진짜 길이 없는 건지 알아야지

Preserve this guided post-result rationale alongside the actual saved edit and four-case classification. It explains the need to identify failure cause without claiming independent API design, a full classifier implementation or new experiment operation. Inputs, transcripts and validation records stay unchanged.

Next writing task is a two-sentence account of direct work and AI support in this coding exercise. Source evidence already separates the one-field choice/save from AI scaffold, branches, execution and checks; the student's own role statement has not yet been supplied.

## 2026-10-29 Student role statement and summary v1

Asked to describe direct work and assistance for the code exercise, Junmo instead gave a broader experimental role account:

> 내가 직접 한 일:실험에 대한 값 예측/방안 설정
>
> AI가 도와준 일:어떤 실험을 할지

Preserve the exact lines. Supplement, rather than silently rewrite, with observed scope: student guided choices, forecasts, interpretations and saved edits; AI code/scaffolds, proposed methods/options, tests, CLI operation, file validation, initial analysis and writing. The AI-help line is not an exhaustive attribution and planning is not independently designing the full method. The evidence-linked Korean summary is now version 1, still explicitly AI-edited and not independently student-authored.

AI prepared a next-task design draft, `experiments/failure-response.design.json`, offering one bounded higher-budget retry versus report-and-wait after budget exhaustion. No mode, retry budget or rationale is attributed to the student, and no implementation or execution occurred. This is separate from the fixed-budget benchmark; any retries must preserve attempt-level budgets and outcomes rather than relabel later success as original-budget success.

## 2026-10-29 Higher-budget retry selected

Junmo wrote **그럼 예산을 느려 한 번 더 시도하는게 맞는 거 같아**. Preserve the response and interpret 느려 as 늘려 in the context of the offered option. Record mode retry-once, not a numeric retry budget or independent code/method authorship.

AI will implement a separate A* wrapper that restarts the same map at most once, only after BUDGET_EXCEEDED; first-attempt success and each attempt's budget/result remain visible, with cumulative work bounded and recorded. It must not retry an already proven UNREACHABLE outcome or modify the fixed-budget benchmark. Known-map regression settings are AI test fixtures, not student-selected experiment parameters. For the next concrete example, AI proposes initial budget 2, retry 4 or 8 and total cap 10; the student's retry value is still pending.

## 2026-10-29 Separate retry module implemented and regression-checked

- AI implemented `src/retry-policy.mjs` and six known-map integration controls, committed as `c9ec36cca7b0e86d6c55fd0445cd6a01a88a73b5`. The student-selected response mode is the only new student design choice; no numeric retry budget or code authorship is inferred.
- All 29 tests pass. Controls verify first-success stop, no retry after exhaustive UNREACHABLE, original failure retention, summed actual work on retry success, termination after one failed retry, budget validation and consistent tie mode on both attempts.
- TAP and canonical source hashes are archived in `data/retry-policy/`. Regression code was checked identical to committed blobs before archiving. Test budgets/layouts are AI-selected known controls, not a student-configured new experiment or independent map samples.
- The wrapper is separate from core/benchmark and not integrated into the current browser. Each attempt restarts and retains its own budget/result; initial-budget success remains visible and actual work is summed under a declared total cap.
- Updated `experiments/failure-response.design.json` leaves the retry budget null. Next student choice: 4 or 8 for an AI-proposed initial-2, total-cap-10 example. No example configured by the student's budget choice has been run yet.

## 2026-10-29 Small-increment preference operationalized before execution

- Junmo wrote **조금씩 늘리자** after the immediately preceding 4-or-8 retry-budget choice. Interpret this as the smaller offered increment, 2→4, while retaining one retry and total cap 10. Preserve the phrase; do not turn it into an explicit numerical response or permission for indefinite escalation.
- New ready configuration: `experiments/retry-connected-02-to-04.config.json`. No student outcome prediction was supplied. The map and related outcomes are previously known regression/example material, so this is a configured demonstration rather than blind new research data.
- AI added a reproducible CLI that requires committed inputs/sources and a new output name. Existing planner and retry wrapper are unchanged. Record config/source before execution and preserve each attempt and total cost.

## 2026-10-29 Committed 2→4 policy demonstration executed

- AI committed the numeric interpretation/config and reproducible CLI in `f3ff64957a80563517af46822eadd4dd9b6a9453`, then ran the known connected map. First budget 2 and retry budget 4 both return BUDGET_EXCEEDED, empty path and null length. Initial-budget success remains false; no extra retry is added.
- Cumulative work and allocated allowance are 6, below total cap 10. This sums re-examinations across independent restarts, not unique cells. The cap is an upper bound, not a requirement to use the remaining 4.
- Raw/validation records: `data/retry-policy/retry-connected-02-to-04-run-01.json` and `retry-connected-02-to-04-validation-01.json`. The earlier valid route remains a witness that this map is reachable; final budget exhaustion is not relabeled UNREACHABLE.
- CLI syntax, committed input/source integrity, actual-run fields/cost and rejection of existing output without searching or overwrite were checked. Core/retry/parser hashes match prior 29-test sources; no full-suite rerun. Fixed-budget benchmark and current demo remain unchanged.
- Student chose small increments in a 4/8 context, not a literal numeric answer or indefinite retries. Configured demonstration on an already studied map is not a blind forecast test or independent sample. AI provides code/execution/analysis.
- Next task: student writes a user-facing sentence for the final budget-exceeded outcome after the allowed retry, without asserting no path. No message has yet been supplied.

## 2026-10-29 Student-authored budget-ending notice recorded

Asked for a user-facing notice after the retry also exceeds budget, Junmo wrote:

> 예산 초과라고 해서 길이 없다는 것이 아니야. 예산을 조금 더 늘리면 길이 있을 수도 있어.

Retain the original. AI edits the display to **예산을 초과했지만 길이 없다는 뜻은 아닙니다. 더 큰 예산으로 다시 탐색하면 길을 찾을 수도 있습니다.** This clarifies finding a route already permitted by the map, not budget creating connectivity; it makes no success guarantee. The new message configuration retains original policy settings and source config. The statement is notice text, not an instruction to execute another retry.

AI adds guarded CLI display for final BUDGET_EXCEEDED only and checks it on the four archived outcomes. Original config/raw outputs remain immutable; the same known-map run with message is a presentation smoke check, not a new independent sample or blind research trial.

## 2026-10-29 Budget-only notice displayed and verified

- Student's original two-sentence notice and the separately credited AI precision edit were committed with the optional CLI display guard in `770745032620f5ca71a7e77548ff68009e7ee5c7` before the same-policy smoke run.
- Actual four-case checks display configured text for both archived budget failures and no text for unreachable/success; absent message definition returns null. Syntax and guard checks preceded the commit, and runtime sources matched committed blobs. No new full-suite run was claimed for this presentation edit.
- New raw/validation records: `data/retry-policy/retry-connected-02-to-04-message-run-01.json` and `retry-connected-02-to-04-message-validation-01.json`. Policy result is exactly equal to the prior 2→4 record, including initial failure, both attempts, final budget status and total work 6.
- UserMessage is displayed only in the separate CLI prototype. Core, retry algorithm, benchmark, existing configs/artifacts and web demo remain unchanged. This repeat checks presentation, not independent samples or a student outcome forecast.
- Next proposed accounting comparison: direct budget 8 versus an initial budget 2 followed by a budget-8 restart on the same known map. Student expectation and a separate configured comparison are pending; related regression outcomes are known and should not be called blind research.

## 2026-10-29 Direct-versus-restart expectation recorded

Junmo wrote **검토량은 처음부터 예산 8로 한 번 탐색한게 더 적지 않을까?**. Preserve this as a tentative lower-work expectation for direct budget 8 versus an initial 2 followed by a full restart at 8. No numerical totals/difference or rationale were supplied.

AI configures the same known connected map and A* FIFO, with completion budget 8 and total cap 10 per strategy. Direct allocates 8; restart allocates 2+8 and does not reuse frontier state. Count all attempts within each strategy separately; comparison-wide total is not a single-policy budget. The known prior map/regression evidence prevents calling this a blind new map study. New CLI/configuration will be committed before evaluation, preserving source hashes and immutable outputs.

## 2026-10-29 Direct/restart configured comparison executed

- AI committed the student tentative direction, configuration and runner in `eaecbdcb2a31f7373f43bb0d1c04cce7af7bf842` before execution. Raw/validation files are `data/retry-policy/direct08-vs-restart02-08-run-01.json` and `direct08-vs-restart02-08-validation-01.json`.
- Same known map, A* FIFO and completion budget 8: direct succeeds with four moves/8 examined nodes; restart retains a budget-2 failure and then succeeds with four moves/8 more nodes, total 10. Final results/paths are identical. The student's lower-work direction is supported here; no exact count/difference or rationale was supplied.
- Total cap 10 applies independently to each method. Allocated allowances are 8 versus 2+8; actual comparison-wide study work is 18, not one policy's cost. No auxiliary planner calls were used in validation. All three observed policy calls and their costs remain separate.
- Verified successful paths, original failure, cumulative arithmetic, prior-case equality, unchanged 29-test core/retry/parser hashes, source integrity and new CLI output refusal. No full-suite rerun or independent new map sample is claimed. This is a known-case accounting check, not a blind research cohort or a judgment of every adaptive/resumable planner.
- The 2→8 comparison does not replace the earlier 2→4 preference/configuration. Next task: ask how first-attempt information could be handled to reduce repeated work; no student state-reuse design or new implementation is inferred yet.

## 2026-10-29 — AI reference for preserving paused A* state

- Student response to the repeated-work design question: **모르겠네**. No design or forecast supplied; AI proposed state preservation and implemented the module, six checks and configured control runner.
- Separate module keeps frontier/distances/parents/closed/tie order on a fixed snapshot. Cumulative budgets never decrease; pauses retain valid unexamined candidates, exact frontier exhaustion is UNREACHABLE, terminal calls add no work, input/output mutation cannot alter saved state.
- Full suite: 35 passed, zero failures, archived in `data/retry-policy/resumable-astar-tests-01.tap`. Small-layout parity covers 1,024 obstacle layouts × two rules × 12 budgets = 24,576 full-result comparisons to original A*. These are AI regression controls, not student research trials or independent samples. A final boundary check also covers start already at goal.
- `experiments/resume02-to08.config.json` records the AI expected behavior before configured execution. Known fixed map/A* FIFO; resume from cumulative 2 to 8 and reuse historical direct/restart arms without rerunning them. Source/configuration must be committed before the demonstration. Original core, retry, benchmark, demo and student's 2→4 choice are unchanged.

## 2026-10-29 — Configured resume control completed

- Source/configuration committed before execution: `dfa80ee0dbabadf9f3b6dad3ddf77530e2123bb7`; `experiments/resume02-to08.config.json`. AI proposed, coded, operated and validated; student's **모르겠네** remains no design/forecast supplied.
- New artifacts: `data/retry-policy/resume02-to08-run-01.json`, `resume02-to08-validation-01.json`. Known connected 3×3 map, A* FIFO, cumulative targets 2 and 8: pause after 2, then add 6, total 8, success/four moves. Exact first failure and final paths/results match archived arms. Direct 8 and restart 10 are reused historical observations, not reruns. New work: one session/two calls/8 examined nodes, separate from prior study work 18.
- Verified same map, core hash, sum of call deltas, final path, all reported checks, existing-output refusal and byte preservation. Full 35-test archive and source hashes are linked in manifest; tests include 24,576 small-layout result comparisons, not independent new samples.
- Memory is retained, not measured; no timing/energy/physical result or changing-map reuse claim. No core/browser/selected 2→4 change. Next: student explanation of restart versus continuation, pending.

## 2026-10-29 — Student interpretation after the resume explanation

- Exact response: **재시작은 이미 계산한 내용을 다시 탐색하는데 이어가기는 처음 계산한 내용을 저장하고 멈춘 곳부터 이어서 탐색하는 거야.** Context and scope are preserved in `data/learning/resume-interpretation-01.json` against evidence revision `db5a36dc61d3bbe4e7da740249f94e8b71e09359`.
- Correct guided post-explanation interpretation; AI had already supplied the proposal, reference code, execution, results and explanation. No independent invention, prior prediction, student implementation or new run is inferred. Historical raw outputs/manifests remain unchanged.
- Next AI-proposed conceptual question: whether saved information can be used unchanged if a new obstacle blocks a passage during the pause. Student response pending; no changed-map experiment or dynamic replanning result. Current session deliberately uses a fixed snapshot.
- Documentation/learning-record change only; no algorithm or method change and no test rerun required.

## 2026-10-29 — Guided map-change choice, no new run

- Student replied **2** to the AI-provided options: retain old information unchanged or recheck against a map changed by a new obstacle. Selected rechecking; no reason, procedure or implementation supplied. Exact prompt/options/scope are in `data/learning/map-change-choice-01.json`.
- AI source review confirms `createAStarSession` copies the initial map and intentionally ignores later caller edits. Existing regression and manifest support snapshot isolation, not automatic change detection or dynamic replanning. Canonical module/test hashes were checked against the prior manifest; no tests or planner runs repeated.
- Next task requests the student's own reason for rechecking when an obstacle appears on the old route. No changed-map experiment, safety mechanism or physical result claimed. Historical raw outputs and learning records preserved.

## 2026-10-29 — Clarifying already-traveled versus remaining route

- Student reason response: **이미 간 예전 경로에 장애물이 생기면 오류가 생길거야**. `data/learning/map-change-reason-01.json` preserves the exact statement, prompt, source context and ambiguity. Unspecified error is a conceptual concern, not a measured software error or collision.
- AI clarified the distinction: for a robot continuing forward without returning, a wall behind it need not block the remaining route; an obstacle on a future segment can invalidate that segment. Do not attribute this clarification to the student.
- Next AI-proposed conceptual exercise: departure — A — robot → B — goal, forward only; ask which new wall directly blocks the remaining route. Student response pending; no experiment, code/method change or test rerun. Prior raw records/manifests remain immutable.

## 2026-10-29 — Future-segment choice and next detour draft

- Student answered **b** to the forward-only A/B diagram after AI clarification. Record `data/learning/remaining-route-location-01.json` preserves lowercase input and case-only normalization to B. Correct guided location choice, not a numerical forecast, independent method or implementation.
- AI prepared `experiments/changed-map-remaining-route.design.json`: two-row 5×2 grid, original S behind current R, new wall on the old remaining route and G ahead. Four-neighbor movement permits a detour; the next forecast concerns minimum moves from R, not original S. Draft status, student prediction and results remain pending.
- Proposed later check: old remaining-path validation on the changed map and fresh A* from the current position. No new execution, dynamic incremental planner, motion controller or physical measurement. Documentation/input-only change; historical evidence preserved.

## 2026-10-29 — Remaining-length forecast registered before execution

- Student replied **4번** to minimum remaining moves from current R to G. Ready input: `experiments/changed-map-current-position-detour-01.scenario.json`, derived from the preserved draft. Prediction concerns length only, not an explicit route, search work or method/code authorship.
- AI map/control: 5×2, original departure (0,0), current position (2,0), G (4,0); only (3,0) changes to blocked. Four-neighbor unit cost. Fresh A* FIFO budget 30 starts at R. Validate the old remaining path separately from planner failure reasons and check fresh distance with separate BFS. Protocol in `docs/CURRENT_POSITION_REPLAN_KR.md`.
- AI runner source syntax checked. Two hand-known BFS controls plus full suite pass: 37 tests, zero failures; TAP in `data/map-updates/current-position-detour-tests-01.tap`. Core/parser/resume algorithms unchanged. This archive precedes configured execution; source and ready input will be committed first. No changed-map outcome claimed yet.

## 2026-10-29 — Current-position detour control completed

- Source/forecast/input commit `922b3b96b6da020f4a55e754651860da82d66cac`; AI executed `scripts/check-current-position-detour.mjs`. Raw/validation under `data/map-updates/current-position-detour-*.json`; protocol in `docs/CURRENT_POSITION_REPLAN_KR.md`.
- One map update (3,0) open→wall; old remaining path valid before and invalid after. Fresh A* FIFO budget 30 starts at current (2,0), succeeds with four moves/six examined nodes. Separate BFS four; student pre-run remaining-length forecast **4번** matches. Returned route/proof/counts/operation are AI support, not student-supplied.
- Full suite 37 passes before configured execution; source/TAP hashes bind committed revision. Checked current start, only one changed cell, full/remaining original path, new route, independent shortest distance, prior core/parser equivalence and existing-output rejection/byte preservation. No extra planner calls in validation or full-suite rerun afterward.
- Invalid old path is a validation status, not UNREACHABLE/BUDGET_EXCEEDED. Explicit snapshot change plus fresh static planning, not incremental state repair, sensing, motion control or physical measurement.
- Next AI-authored draft `experiments/changed-map-second-wall.design.json`: student picks one bottom-row wall intended to remove the detour. Choice/results pending; retain parent and unsuccessful attempts.

## 2026-10-29 — Three alternative wall choices registered

- Exact student response **3, 4, 5 중에 아무거나** nominates each offered bottom-row position as sufficient for no route. No rationale or examined-node forecast. Config `experiments/changed-map-second-wall-choices.config.json` records the statement before execution.
- Each case resets to the same parent and adds exactly one wall. AI-added controls 1/2 carry no student forecast. Same R/G, existing wall, unit-cost four-neighbor movement, A* FIFO and per-case budget 30. Reuse parent raw path without rerunning parent. Check its validity on each map, new search and separate BFS.
- Thin orchestration `scripts/check-second-wall-choices.mjs` reuses unchanged core/parser/BFS with committed-input/source and immutable-output guards. Syntax and configured execution/row arithmetic will be checked; no full-suite rerun is required for this orchestration-only addition. Results pending source/input commit.

## 2026-10-29 — Separate wall-choice outcomes verified

- Forecast/config/source commit `928e81b0ca8ab1f4f0d76e53b57d418a7580de82`. AI ran `scripts/check-second-wall-choices.mjs`; raw/validation: `data/map-updates/second-wall-choices-*.json`.
- Student-selected cases 3/4/5 each add one different wall to the same parent. A* FIFO budget 30 per case: all UNREACHABLE, examined 5/6/7 respectively; null lengths/empty paths and separate BFS null distance preserved. No budget failures. AI controls 1/2: success/four moves/six examined each, BFS four; not student forecasts.
- Parent path remains valid for 1/2 and is blocked for 3/4/5. Parent raw result reused, not rerun. New shared planner calls 5 and independent BFS calls 5. Five related variants of one parent, not independent random maps.
- Verified one changed cell per case, fixed start/goal/existing wall, exact prediction, outcome fields, source/input hashes, previous 37-test core/parser/BFS equivalence and existing-output refusal/byte preservation. Thin CLI syntax and real configured execution checked; no full-suite rerun or inclusion in previous suite source claimed.
- Student supplied no rationale/count/code/operation. Next task asks why 1/2 retain the route while any of 3/4/5 cuts it; explanation pending. No physical/dynamic incremental result.

## 2026-10-29 — Isolation interpretation and AI reference policy

- Student post-result statement and ambiguous 어디 preserved in `data/learning/second-wall-isolation-01.json`. AI conditionally scopes the isolation rationale to nominated 3/4/5; controls 1/2 remain reachable. No formal proof or code attributed to the student.
- AI implements `src/route-update-policy.mjs`: validate only the remaining suffix from an explicit current index on the supplied latest static map; KEEP_ROUTE without planning if valid, otherwise fresh A* yielding NEW_ROUTE_FOUND, UNREACHABLE or BUDGET_EXCEEDED. Prefix walls do not invalidate an unaffected suffix. KEEP_ROUTE need not be shortest after changes. No sensor, actuator or incremental state repair.
- Six new AI regression controls; full suite 43 passed/zero failed. TAP `data/route-update-policy/route-update-policy-tests-01.tap` includes known wall fixtures, current-position alignment, budget/no-route distinction, invalid inputs, detached paths and valid-but-longer/at-goal behavior.
- Config `experiments/route-update-policy-controls.config.json` declares seven known archive-based integration cases, not new student predictions or independent research maps. Source/input commit precedes configured execution; results pending.

## 2026-10-29 — Reference policy integration controls completed

- Source/config `fdd817c0d6077cdbf5a34ba9e1ae829823c80e7a` committed before AI execution. Raw/validation: `data/route-update-policy/known-controls-*.json`; protocol `docs/ROUTE_UPDATE_POLICY_KR.md`.
- Seven known controls: KEEP_ROUTE twice (zero new planner calls/expansions), NEW_ROUTE_FOUND once (6), UNREACHABLE three times (5/6/7), BUDGET_EXCEEDED once (2). Five new A* FIFO calls/26 examined nodes; normal budget 30, small budget 2. Shared-planner reruns are charged; no new BFS calls. No independent new maps or student forecasts.
- Full suite 43 passes before source commit; exact tested module/dependency/TAP bytes match commit. New thin integration driver checked by syntax, actual committed run, output immutability, cost arithmetic and raw/archive comparisons, not retroactively treated as covered by prior test source or a repeated full suite.
- Zero new expansions excludes map copying and path validation, not zero total cost. No elapsed-time/energy/hardware or automatic sensing/incremental search/browser integration. AI authored default KEEP_ROUTE policy, code, tests, operation and initial analysis.
- Next AI-proposed engineering choice: keep a still-valid path versus spend new search work when a shorter route appears. `experiments/valid-route-optimization-choice.design.json` preserves pending student preference; this is not another isolation-explanation request.

## 2026-10-29 — Student selects reoptimization as default

- Exact response **2** to retaining a valid route versus seeking a shorter one. `data/learning/valid-route-optimization-choice-01.json` records objective/default only; no reason, forecast, code or operation inferred. Prior draft remains immutable.
- AI changes resolveRouteUpdate default to reoptimize on each explicit invocation (except already at goal), retains explicit keep-valid. A bounded fresh search can find a shorter path or confirm equal optimum. AI fallback preserves a verified route if optimization exhausts its budget, exposing optimizationStatus and original failed planningResult separately. Invalid-route budget failure still returns no usable route. No automatic retries.
- Four new controls plus adjusted explicit legacy cases: full suite 47 passes, zero failures; `data/route-update-policy/reoptimization-tests-01.tap`. Tests cover shorter path, equal optimum, valid fallback/raw failure, current suffix/tie rules and invalid modes. Historical integration driver explicitly selects keep-valid for old configs.
- New `experiments/route-reoptimization-controls.config.json` specifies five AI-known controls on two small snapshots, with student outcome prediction null. Source/input commit precedes configured comparison and historical compatibility rerun.

## 2026-10-29 — Reoptimization comparison and legacy replay verified

- Student default choice/source/config committed as `1c48e39b3e8b89b32523ce3a931bcb8df7bb8d08`. AI ran `reoptimization-comparison-run-01.json` and `keep-valid-compatibility-run-01.json`; joint source/TAP/result checks in `data/route-update-policy/reoptimization-validation-01.json`.
- Comparison: five known controls/two 3×2 snapshots/A* FIFO. Budget 30: removed wall, keep length 4/0 expansions versus default length 2/3; unchanged, keep length 4/0 versus default length 4/5. Budget 1 after removal: keep verified old length 4 while raw optimization fails budget. Comparison totals 3 planner calls/9 expansions and 2 independent BFS calls, separate from validation work.
- Compatibility: seven known old controls rerun with explicit keep-valid; original output fields/path/calls/costs match prior archive (5 calls/26 expansions). Enriched new metadata is not called byte-identical; old raw files unchanged.
- Full suite 47 passes before source commit; module/test/TAP hashes match. Drivers separately syntax/configured-run/output-guard checked; no suite repeated afterward. Student supplied default choice only, not fallback/API/code/tests/fixtures/forecast or operation. No universal improvement, runtime/energy or physical claim.
- Next `experiments/route-reoptimization-batch.design.json`: AI-proposed unexecuted 30-map wall-removal matched comparison, student forecast pending. Freeze ready protocol before execution, separating theoretical shorter paths from improvements actually found within finite budget.

## 2026-10-29 — Thirty-map comparison frozen with explicit uncertainty

- Exact student pre-run response **모르겠어**, direction null, in `experiments/route-reoptimization-batch-01.protocol.json`. Earlier reoptimization choice is not an outcome forecast. AI supplies study method/code/operation.
- Base seed 20264027, 16×12/.19, first 30 connected maps with walls; candidate BFS/audit and maximum 4500 checks. Remove row-major wall at seed modulo wall count. Matched keep-valid/reoptimize, A* FIFO budget 300 per invocation, start remains original corner.
- Offline unlimited prior A* work recorded separately, checked against candidate BFS; edited-map BFS measures potential shortening, distinct from realized within-budget shortening/valid fallback. All map/policy denominators and failed optimization attempts retained.
- Three new methodology controls, full suite 50 pass/zero failures in `data/route-update-policy/reoptimization-batch-tests-01.tap`; no registered cohort preview. Protocol/source commit required before configured execution.

## 2026-10-29 — Thirty-map null improvement preserved

- Source/protocol/uncertainty commit `6cc390ac329808b6707e97292dc1db247cd11afd`; AI execution/validation in `data/route-update-policy/reoptimization-batch-*.json`, detailed record `docs/ROUTE_REOPTIMIZATION_BATCH_01_KR.md`. Candidate sequence 36 checked/6 unreachable/30 accepted, exactly one prescribed wall removed per accepted map. No reselection after results.
- Same 30 parent/edited pairs, A* FIFO budget 300: theoretical/realized shorter paths 0/30, unchanged lengths 30/30; both mean moves 26.1333, all returned paths usable. All 30 optimizations complete with zero budget failures, online new expansions 3,733 (124.4333/map) versus retention zero. Thirty pairs reused by two policies, not 60 independent maps.
- Separate offline prior acquisition 30 unlimited A* calls/3,650 expansions; online 60 policy evaluations/30 new calls/3,733 expansions. Cohort BFS 36 candidates+30 edited maps; validation adds 66 BFS checks/zero planner calls. Checks cover deterministic seeds/rejections/edits, prior/returned paths, summaries, 50-test/source hashes and output immutability; no full-suite rerun.
- Post-result AI analysis: 28 original paths length 26 (Manhattan lower bound); two length 28 remain 28 after selected edits. Student supplied uncertainty only. Original all/some question omitted zero; zero was permitted in numeric protocol and is preserved. No universal claim about every edit or reoptimization.
- Next AI proposal `experiments/manhattan-bound-skip.design.json`: skip optimization only if latest-map remaining route is valid and equals current-goal Manhattan bound. Student preference/implementation/comparison pending, not measured savings or student invention.

## 2026-10-29 — Lower-bound skip adopted before replay

- Student chose **1**; exact context/scope in `data/learning/manhattan-bound-choice-01.json`. Adoption of AI proposal only, after original cohort analysis; no independent invention/code/proof or numeric savings prediction.
- AI default skipProvenOptimal=true: verify latest-map remaining suffix first, skip only when its length equals current-goal Manhattan bound. Expose bound versus A* optimality evidence. Explicit false forces prior reoptimization; old batch runner pins false to preserve its frozen protocol.
- Five new tests bring suite to 55 passed/zero failed. Includes invalid old bound-length path, current suffix/past blocked cell, valid above-bound detour and 1,024 layouts × two rules =2,048 guarded/unguarded route checks. AI tests, not independent research samples. TAP `data/route-update-policy/manhattan-bound-tests-01.tap`.
- New protocol `experiments/manhattan-bound-comparison-01.protocol.json` reuses all prior 30 inputs/paths, runs both arms anew, checks baseline original fields against archive and separates bound proofs from actual search completions. Same development cohort, not held-out validation. Source/protocol commit precedes replay.

## 2026-10-29 — Bound-check development-cohort replay completed

- Source/protocol/student adoption commit `e3cd5f6fada5e43b594f6ba998118eea8370ce90`; raw and validation `data/route-update-policy/manhattan-bound-*.json`. AI operated/validated, student selected rule only.
- Same 30 archived edited maps/base 20264027/16×12/.19/current corner starts/prior paths, A* FIFO budget 300. All baseline original fields replay exactly and revised returned paths/lengths match 30/30; both mean moves 26.1333. Calls 30→2, expansions 3,733→201, means 124.4333→6.70, saved 3,532 (94.6156%). 28 valid-route bound proofs, two actual A* completions, no budget failures.
- Comparison-wide fresh work: 60 policy evaluations/32 A* calls/3,934 expansions, no new sampling/prior acquisition/BFS in driver. Validation adds 30 BFS checks/zero planner calls. Costs exclude copying/path validation/independent checks; no timing/energy/physical claim.
- Full suite 55 passes, including 2,048 small-grid paired checks; source/TAP match. Thin driver syntax/actual replay, old fields, maps/paths, proof source, counts and existing-output/byte guards checked; no full-suite rerun afterward. Original baseline/protocol/raw files preserved.
- Same development cohort that motivated rule, not held-out or independent validation. Next AI draft `experiments/bound-skip-followup.design.json` freezes a new seed/cohort only after student picks high/low generation probability. Choice/data not yet supplied or generated.

## 2026-10-29 — Denser follow-up frozen before generation

- Student selected **1**, the denser option. Exact context in `data/learning/bound-skip-followup-density-01.json`; probability .28 was the AI-offered operationalization, no student performance forecast.
- Ready acquisition and comparison protocols: `experiments/bound-skip-dense-followup-*-01.protocol.json`. Both frozen before any new generation. Base seed 20265027, 16×12, first 30 connected maps with walls, deterministic one-wall removal, same prior routes per pair/A* FIFO budget 300. Guard fixed from development study.
- Existing tested scripts/module reused without code changes; no repeat 55-test suite. Acquire/commit immutable baseline first, then run both comparison arms against identical inputs and validate new distances/costs/paths/proof versus search counts.
- This is a new condition-specific cohort; differing density AND seeds prevent a causal density attribution versus prior study. New seed range alone is not statistical-independence proof. Results pending.

## 2026-10-29 — Dense baseline acquired and frozen before paired replay

- Acquisition source/protocol commit `a6c5111869775f704895a12c91f8e51ba2b98688`, existing unchanged driver. New raw `data/route-update-policy/bound-skip-followup-dense-baseline-run-01.json` will be committed as input to the already frozen comparison.
- Candidate checks 75/accepted 30. Offline prior A* calls 30/2,611 expansions; unguarded online reoptimization calls 30/2,690 expansions. Separate candidate/edited BFS counts 75/30. One selected edit admits and realizes a two-move improvement; other 29 lengths unchanged. No student forecast.
- Bound comparison pending; no baseline reselection or source-rule change after acquisition. This is a staged acquisition artifact, not the final guarded result or a fresh full-suite run.

## 2026-10-29 — Dense comparison scope-label correction

- The first new-condition run `data/route-update-policy/bound-skip-followup-dense-comparison-run-01.json` executed under source `fd799ad5b645a605fb7cf269157fbd1203861623`. Its protocol is the new frozen dense follow-up, but the reused driver label incorrectly retained the old same-development-cohort wording. Numeric results and protocol remain valid; preserve this original raw output.
- Correct the driver label to direct readers to the frozen protocol for cohort scope. This is metadata-only; no guard, planner, sampling, input or output values change. Create a separately named label-corrected derivative, retaining original execution provenance plus explicit correction lineage; do not rerun planner/cohort or present the derivative as a replication.
- The scope remains condition-specific unseen-at-freeze validation with no statistical-independence or causal density claim. Original development-cohort results retain their historical label.

## 2026-10-29 — Dense follow-up validation complete

- Frozen before generation `a6c5111869775f704895a12c91f8e51ba2b98688`; acquisition stored/committed then numeric comparison under `fd799ad5b645a605fb7cf269157fbd1203861623`. Corrected primary and original raw plus lineage in `data/route-update-policy/bound-skip-followup-dense-validation-01.json`.
- Base 20265027/.28/16×12, candidate 75/accepted 30/rejected unreachable 45, prescribed one-wall edits. Same-current-map/prior-route forced vs guarded A* FIFO budget 300: identical BFS-optimal paths 30/30, mean moves 26.6667; calls 30→9, expansions 2,690→844, means 89.6667→28.1333, savings 1,846 (68.6245%). Bound proofs 21/search completions 9, no budget failures.
- Original lengths 21×26/7×28/2×30. One potential and realized improvement: trial4/seed20265032/wall(15,9), 28→26; guard does not skip it. Student selected condition only, not performance/analysis.
- Acquisition offline 30 calls/2,611 expansions; online baseline 30/2,690; BFS 75+30. Paired replay adds 39 calls/3,534 expansions and no new acquisition/BFS. Validation adds 105 BFS checks/zero planner calls; metadata correction adds no numerical work.
- Existing 55-test dependencies match, no repeat full suite. Comparator label fix is metadata-only; source diff and corrected derivative equivalence/parent hashes checked. Candidate/maps/edits/paths/BFS/proofs/costs/output immutability validated. New condition fixed before generation, but no statistical-independence or causal density claim. No runtime/energy/physical/browser result; budget300>192cells is not small-budget stress.
- Next student task: one report sentence on what remains unchanged and what decreases. Student sentence pending; do not write AI wording as student-authored.

## 2026-10-29 — Student report conclusion recorded

- Exact post-result response **이미 최단루트를 찾았다면 굳이 더 재검토하지 않아도 됨. 그래서 검토량 확 줄임.** in `data/learning/dense-followup-conclusion-01.json`, tied to the dense validation/source context. Student interpretation follows AI results and writing prompt; not a pre-run hypothesis, independent proof/code or execution.
- AI precision edit separately adds latest-map validity, lower-bound proof at the current position, preserved route and new planner-node counts. Original remains unchanged. Former shortestness alone cannot establish current feasibility/optimality. No new experiment or test run.
- Next AI-proposed draft `experiments/bound-skip-budget-stress.design.json` changes only budget to offered 50/100 on the same known dense inputs. Separate usable path from optimization completion/budget failure; selection/results pending. Prior expansion counts are already known, so no blind/independent cohort claim.

## 2026-10-29 — Budget 100 selected and analysis controls registered

- Student exact **2**, mapping to the offered 100-node budget, in `data/learning/bound-skip-budget-choice-01.json`. No performance forecast/reason/code supplied. Ready protocol `experiments/bound-skip-budget100-01.protocol.json` changes only the budget from 300 on the same 30 dense inputs.
- AI updates the comparison analysis, not core/policy: permit a valid cached path longer than latest BFS after optimization timeout, retain original failed planningResult, separate new-search completion from usable/optimal-returned route counts and bound proofs. Reference300 matching applies only when full work fits100; otherwise failure at100 is expected.
- Two new controls bring full suite to57 passed/zero failed; TAP `data/route-update-policy/bound-budget-stress-tests-01.tap`. Controls distinguish suboptimal valid fallback and already-shortest fallback from completed searches/proofs, reject corrupted failure/optimality claims.
- Protocol/source commit precedes the configured budget100 replay. Same known cohort, full counts already available; not blind research/new independent maps. Results pending.

## 2026-10-29 — Budget100 results preserve route/optimization distinction

- Source/protocol/student parameter commit `4c78f0aafdfab6babb4bcf5b11fa204b0ef8a022`; raw/validation `data/route-update-policy/bound-skip-budget100-*.json`. Same known30 dense inputs/current starts/prior paths/A* FIFO, budget only300→100. No new student hypothesis or independent cohort.
- Guard:21 bound proofs+6 search completions+3 optimization budget failures;9 calls/798 expansions. Forced:21 completions+9 failures;30 calls/2,581 expansions. Both keep valid usable routes30/30 and identical paths/reference300; all returned lengths match offline BFS, mean26.6667, one shortening retained. Guarded policy optimality evidence27/30 versus external validation30/30; do not count the three budget failures as completed searches or unreachable.
- Original raw failed planningResult remains BUDGET_EXCEEDED/empty path/null length at100; separate top fallback remains valid. Other regression fixtures retain valid-but-suboptimal fallbacks, so no universal shortest-fallback claim. Compared to guarded300:completions9→6/failures0→3/expansions844→798.
- New comparison work60 evaluations/39 planner calls/3,379 expansions, no new cohort/prior/BFS in driver. Validation adds30 BFS checks/zero planner calls. Full suite57 passes before run, exact source/TAP, reference fit/truncation, proof/failure/cost/denominator and immutable-output checks; no post-run suite repeat.
- Next `experiments/optimization-timeout-response.design.json`: student chooses ending this call with the verified route or separately bounded further optimization. Current fallback is AI-proposed; no added budget/retry or motion command executed by this draft.

## 2026-10-29 — Further optimization selected and bounded continuation implemented

- Student exact **2** in `data/learning/optimization-timeout-choice-01.json`: continue optimization with valid fallback. AI operationalizes initial100 plus50 to cumulative150, one continuation only, same fixed snapshot; default resume, explicit retain/restart controls. No student numeric setting/code/forecast inferred.
- AI API preserves every stage and charges resume deltas versus full fresh restart costs. Search-session counts are distinct from stage/core-plan/resume-advance calls. Only valid cached-route budget failures continue; invalid-route failures, initial success/bound proof and a second failure stop. No movement/sensor behavior.
- Six new controls, full suite63 passed/zero failed; `data/route-update-policy/continuation-tests-01.tap`. Old study drivers explicitly select retain to preserve frozen protocols; no original raw files overwritten. Same-known-cohort protocol `experiments/route-continuation-100-150-01.protocol.json` frozen before replay.
- Metadata erratum `data/route-update-policy/budget100-comparison-erratum-01.json` preserves old validation while correcting duplicate after-key summary names to explicit completion/failure/expansion fields. Primary raw/main counts remain correct; no numerical rerun.

## 2026-10-29 — Bounded continuation/accounting verified

- Frozen source/protocol/student response `e84a92baef81d0be15ab937cb9969a75b4059a26`; raw/validation `data/route-update-policy/continuation-100-150-*.json`. Same known30 dense inputs/A* FIFO/bound proofs, no new sampling or student forecast.
- Retain100:798 expansions,6 completed/3 final budget failures. Resume100→cumulative150:844 expansions,9 complete/0 final failures. Restart100→fresh150:1,144 expansions,9/0. All retain valid same paths/mean26.6667, bound proofs21. First failures3 preserved in each stage journal. Resume adds46 versus stopping, avoids300 rework versus restart; no returned-length gain here.
- Explicit per-case maximum work100/150/250, common comparison ceiling250; restart not called50 extra actual work. Search sessions9/9/12, stages9/12/12; new whole-study90 evaluations/30 sessions (core calls21/resumable sessions9/advances12),2,786 expansions. Validation adds30 BFS checks/no planner calls; new cohort/prior/BFS in driver0.
- Source/TAP63 tests, input/reference100/reference300 paths, all deltas/caps/stage counts/raw failures/detached outputs and immutable-output guards pass. No suite repeated after configured run. Known small controls retain a second-failure stop; no universal completion promise.
- Original budget100 validation remains immutable; `budget100-comparison-erratum-01.json` repairs duplicated after-key names via explicit before/after fields, verified against raw300/100. No numerical rerun.
- Next `experiments/robot-model-inputs.design.json`: hardware availability/model/dimensions pending before finite-body/motion modeling; no physical experiment claim.

## 2026-10-29 — No hardware reported; assumed body geometry registered

- Exact user **아직 없는데** in `data/learning/robot-hardware-context-01.json`. No measured dimensions/model or hardware execution inferred. AI begins simulation-only geometry, not a purchase recommendation.
- New `src/disk-footprint.mjs`: circular disk against closed unit-square obstacles/world boundary, centers at grid centers, four-neighbor straight edges, contact forbidden. Assumed cell-side units, radius+clearance. Configuration graph and original-geometry swept-edge checks, explicit invalid endpoint status; no kinematics/control/sensing. Core point planner unchanged.
- Seven new geometry controls/full suite70 passes, TAP `data/footprint/disk-footprint-tests-01.tap`. Zero-radius compatibility, narrow/wide passage, tangency, Euclidean corners, boundary/endpoints, swept edges and invalid inputs checked on known fixtures.
- Ready `experiments/disk-footprint-corridor-01.protocol.json`: six related controls/two9×7 layouts, same S/G,A* FIFO budget100, disk radii0/.4/.5/.6 and margin0/.2. AI hand-known width expectations, no student forecast. Source/protocol commit required before configured execution.

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
