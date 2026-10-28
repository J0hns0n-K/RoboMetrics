# RoboMetrics kickoff engineering record

Date: 2026-10-27, Asia/Seoul. **AI-authored preparation record**, not a completed student-authored Engineering Report.

## Evidence and attribution

- Private repository created: `https://github.com/J0hns0n-K/junmo-robometrics`.
- Original 20-file reference commit: `43fa8ec965180532c1fcf4a553309ed350b25277`.
- ZIP SHA256: `211136cc54687af919f897fc4d19f86c25ae0365dd49ceadbc2424f56f646b61`.
- Master Handoff v2 SHA256: `60472771df326048d8a93020a2d808ec7623d8633159b33c0b8ec7610765e432`. Read as project context; school document links were not fetched.
- Baseline executed by AI assistant: Node v24.22.1, Windows x64, original six tests passed.
- New scripts, audit tests, explanatory documents, and example scenario: AI assistance, separate from the original reference import.
- Student evidence: Junmo answered `4` for an open 3×3 corner-to-corner grid, selected the center obstacle from AI-provided options, predicted `4번` before execution, and interpreted the observed distance comparison in chat (quoted below). See `TASK_01_DECISION.md` and the separately committed scenario. Student-authored code, independent map design, explanation of expansion counts, and independently operated trials are still pending.

## Question and method

Start by distinguishing number of moves from number of examined nodes. Then let the student design an obstacle map, record an explanation/prediction before execution, and compare unlimited and budgeted runs. A later counterexample task examines Greedy's path quality.

Algorithm validation: keep `src/core.mjs` unchanged; compare all 1,024 obstacle assignments on a 4×3 grid to an independently written BFS; verify exact budget boundaries and valid paths. The initial Dijkstra baseline alone is not independent because it shares the search engine with A*.

Execution artifacts under `data/reference/` are assistant-run reference checks. Their source commit, input/source hashes, environment, timestamps, and dirty-workspace state are recorded. They are not student-run experimental evidence. A clean source commit identifies code; generating a result file creates a later artifact commit.

## Results and interpretation

All 11 tests passed (original six plus five AI-authored audits), on clean source commit `10c99f0d4a1bb29b75e0f04b26333a61d3e72eaa`. Raw TAP and a validation manifest are in `data/reference/`.

The assistant-run open 3×3 reference produced four-move paths for all policies; A* and Dijkstra examined 9 nodes, Greedy 5. With budget 5, Greedy succeeds and A* exceeds budget under the recorded FIFO tie break. This demonstrates the difference between path length and expansion count, not a general algorithm ranking.

Browser smoke test: original UI rendered, its 30-trial benchmark completed, and Export JSON produced `data/reference/browser-benchmark.json`. Parameters: seed 20261027, 16×12, density 0.19, budget 180, 30 reachable-only paired maps. A* and Greedy both solved 30/30; mean path length was 26.0667 vs 28.4, mean expansions 118.7667 vs 32.7. This is one **AI-run reference condition**, not the preregistered 12-condition student experiment matrix. Screenshot: `data/reference/ui-smoke.jpg`. The individual displayed map and the batch's rejection-sampled maps are separate views.

One simple map cannot establish that an algorithm is universally better. Expansion count is not elapsed time. The original random benchmark uses reachable-only rejection sampling; route length summaries condition on success. Neither this grid nor its metrics describe physical robot performance.

## Guided student exercise — center obstacle

The student's guided obstacle choice and four-move prediction were committed in `97736facb939ed1da56f6255baf405d2646eaa0d` **before** execution. The assistant then ran `experiments/task-01.student.json` on that clean source. Full paths, failures and budgets are in `data/guided/task-01-run-01.json`.

| Policy | Unlimited path moves | Examined nodes | Success at budget 5 |
|---|---:|---:|---|
| A* | 4 | 8 | No, budget exceeded |
| Greedy | 4 | 5 | Yes |
| Dijkstra | 4 | 8 | No, budget exceeded |

The student's path-length prediction agrees with the result. After seeing the result, Junmo wrote: **장애물이 있다고 해서 최소 이동 거리가 꼭 바뀌는 것은 아님** (an obstacle does not necessarily change the minimum travel distance). This student interpretation is supported by the paired open/center-blocked grids, both four moves. The claim is limited to demonstrating that an increase is not inevitable; it does not predict arbitrary maps.

The separate computational interpretation is **AI-written**: path lengths match while examined-node counts differ; FIFO ties make A* examine additional equally scored candidates before the goal. This single guided example does not establish general algorithm superiority or an implementation improvement. No student-authored algorithm change has been made.

On 2026-10-28 the student saved a guided budget edit from 5 to 8 in `practice/02-planning-budget.mjs` and expected A* to succeed before the rerun. AI executed clean source `d8ec3262379930eec7c0cc393fd766a3528fb02a`: both found four-move paths, A* examining 8 nodes and Greedy 5. Budget-5 and budget-8 transcripts/metadata under `data/learning/practice-02-budget-*` retain the unchanged core hash. This connects the student's saved parameter edits to a matched budget-failure/success comparison; outcomes had previously been explained, so this is a learning verification, not a blind new research prediction or student algorithm implementation.

## Guided exercise 02 — minimum distance increases on a matched obstacle map

AI supplied a 5×3 detour map and explained the wall-free four-move baseline. Before execution, Junmo answered **8** for the obstacle map. Inputs and the prediction were committed in `9aed8478d02ac5ce0e08448333400cacfc375771`; both assistant-operated runs used that clean source. Raw records: `data/guided/task-02-open-run-01.json` and `data/guided/task-02-detour-run-01.json`.

All three policies found 4 moves on the matched open map and 8 on the obstacle map, agreeing with the student's detour prediction. Width, height, endpoints and movement rules were held constant. The earlier 3×3 map is not the control for this comparison. A*/Greedy examined 5/5 nodes on the open map and 9/9 on the detour. At budget 8 none succeeds on the detour; at budget 9 all succeed.

AI route explanation: down twice, right twice, up twice, right twice reaches the goal in 8 moves. The first vertical wall forces the two-row detour; a path needs at least four net rightward moves, two downward and two upward. Student route reasoning and post-result interpretation remain unrecorded. The student's actual contribution is the correct prior numerical prediction; the map, control, transcription, operator work and explanation are AI assistance. No search-engine implementation change or Greedy path-quality counterexample has been made.

## Guided exercise 03 — student-selected revision and controlled rerun

Junmo answered **1번 벽/4번** when asked which numbered wall to remove and what minimum distance to predict. The selected revision opens only (1,0), immediately right of S. Scenario and prediction were committed first in `9ef0caf4d43b0a75da317ca335de57cf1fa72d27`. The assistant then executed the revised map on that clean source. Raw results and the checked comparison are in `data/guided/task-03-run-01.json` and `data/guided/task-03-comparison.json`.

The before/after comparison checks that exactly one cell changed, dimensions/endpoints/budgets match, and core/runner hashes match. All policies' shortest returned lengths changed from 8 to 4, agreeing with the student's prior prediction. A*/Greedy examined 9→5 nodes; Dijkstra examined 9→9. AI explanation: four rightward moves along the opened top row achieve the four-column lower bound.

After the result and AI route explanation, Junmo wrote in his own chat response: **그 1번 벽이 최소 이동 루트를 막고 있었어. 다른 벽들은 그 최소 이동 루트에 관여하지 않았고**. This elicited interpretation identifies the changed wall's role in blocking the direct shortest route and the remaining walls outside that route. The claim is supported for this layout. It was recorded after results and discussion, not as a prior rationale or an independently derived proof.

The guided exercise now includes a student-selected environment revision, prior prediction, an assistant-operated matched rerun and the student's post-result explanation. This is distinct from independently written code, algorithm optimization, a general performance gain or physical robot work. The student's selection/prediction/explanation, and the AI's map prompt/transcription/operation/analysis, remain separately attributed.

## AI-selected path-quality counterexample — 2026-10-28

An assistant search selected the first qualifying 5×5 generated map, seed 260 at density .28, where Greedy returns a longer valid path while examining fewer nodes. Selection occurred after seeing outcomes; it is an explanatory counterexample, not student discovery, a blind preregistered result, or a random sample for general performance estimates. Selection protocol and map are in `COUNTEREXAMPLE_01_KR.md` and `experiments/reference-greedy-detour.json`.

Reproduction on clean source `87ae90e391d36a72d62c78827664c6bf288172ee` gave A*: 8 moves/20 examined nodes; Greedy: 12/14; Dijkstra: 8/20. The valid eight-move route achieves the Manhattan lower bound between opposite corners. At budget 14 Greedy succeeds and A* exceeds budget; at budget 20 both succeed with different route lengths. Thus budgeted success and route optimality differ on this case, without changing the original planner.

All 13 tests passed, including two new AI-authored counterexample regressions. Raw run, TAP and provenance are in `data/reference/greedy-detour-run-01.json`, `counterexample-tests.tap` and `greedy-detour-validation.json`. AI prepared a visual comparison directly from returned path coordinates.

After that guided comparison, Junmo volunteered a different route: **down 3, right 2, down 1, right 2**, observing that wall removal is unnecessary for an eight-move route to exist. The exact response and instructions were committed in `004deec939bdd10bebb3871c66ee44410557b0f6` before AI verification. The reconstructed path is valid on the unchanged map, eight moves long, and attains the geometric lower bound of 8. AI checked all 32 subsets of existing walls removed; the same valid optimal route persists. This verifies a scoped statement about the current layout and removing existing walls, not arbitrary obstacle additions or 32 independent trials.

The student's contribution is the alternative path and interpretation after prior instruction; AI supplied the original example and operated/formalized verification. No student algorithm implementation or original discovery of the counterexample is claimed. The verified distinction is that an optimal eight-move path exists while the unchanged Greedy returns twelve moves. Raw verification is in `data/guided/task-04-route-check.json`. Further algorithm comparison can preserve the existing map rather than removing walls.

## Full paired matrix — 2026-10-28

Before the full run, Junmo expected A* to return shorter paths based on prior guided examples and said he did not understand success frequency. After the assistant clarified the metric, he explicitly replied **아직 모르겠어** about which policy would succeed on more maps. The protocol preserves both responses. The initial A* answer must not be represented as a falsified directional success-rate hypothesis.

AI-authored orchestration preserves the original planner and benchmark, adds rejected-map/seed accounting and checks identical maps across budgets within each density. It records separate denominators for each policy's successful-route mean, common-success route comparisons and optimal-within-budget counts. These method additions are AI support, not student-written implementation.

The original 16×12/.12/.19/.28/75/120/180/300/30-solvable-map conditions were run on clean source `2dda59173bfc99ce0c9ad418f3724edf621d6a1e`; all 16 tests passed. There are 90 density-specific cohort entries reused for 360 map/budget conditions and 720 A*/Greedy policy calls. These are not independent maps/trials of those larger counts. Density-specific rejection totals are 0/30 candidates, 4/34 and 26/56; accepted seed cohorts can differ between densities.

At density .19/budget 120, A* succeeds on 15/30 and Greedy 30/30. On the common 15 successes only, mean moves are 26 and 27.6. At budget 300 on the same 30 maps, both succeed and mean moves are 26.0667 vs 28.4. Thus more budgeted successes and shorter returned routes are distinct properties in this sample. These findings apply to this fixed-seed reachable-only cohort and the current implementation, including FIFO ties; they do not establish general superiority.

Raw rows, seed audits, CSV, TAP and SHA256 manifest are in `data/batch/`; the full table is `MATRIX_RESULTS.md`. Three post-hoc AI-selected reports preserve complete paths and show an A* budget failure, a longer Greedy route (40 vs 26), and a map where both exceed a tight budget despite reachability. Case reproduction matches recorded metrics; these replays are not additional independent samples.

After seeing the results and receiving clarification of success frequency, Junmo stated: **그러네. 짧은 길을 찾는 것이랑 길을 많이 찾는 것은 다르네. 계산 제한이 있으면 아무리 짧은 루트라도 실패로 되니까 그렇네.** This is the student's guided post-result conceptual distinction between route length and budgeted route discovery. AI clarified the precise meaning: a short route may exist while the policy does not find it within budget; an already-found valid route is not reclassified as a failure. The statement is not a prior forecast or evidence of independent implementation/execution. Exact response and timing are in `MATRIX_RUN_KR.md`. This remains an AI-authored engineering record rather than a completed student-authored report.

## Optional equal-f tie-breaking comparison — 2026-10-28

Junmo considered the two equal-total candidates equivalent; the exact statement is preserved in `experiments/tie-break.protocol.json`. He did not choose lower-h ties or give a numerical node-count hypothesis. AI formulated the controlled operational question: whether equal-f ordering changes examined nodes and budgeted success without changing optimal returned path length. The student's statement is not retroactively converted into a quantified zero-effect prediction.

AI added an opt-in `closer-goal` fourth-parameter option to `plan`, retaining f=g+h as the primary score and FIFO as default. At equal f, larger g is smaller h. All other planning rules and the original accepted map cohorts remain fixed. Implementation, tests, alternative rule, operation and current numerical analysis are AI support.

On committed experimental source `260ac09d063c422b92acef8ad4a6afbb622429f7`, all 19 tests pass and all 720 historical default A*/Greedy metrics reproduce. Variant reachability/optimality is checked on all 1,024 4×3 obstacle layouts against the independently audited reference; all successful variants in the full comparison equal the reference shortest length. The unrelated practice-file working edit is declared in metadata; experiment inputs themselves are committed, so do not describe the entire workspace as clean.

The small center-obstacle control retains the same four-move path with examined nodes 8→5. In the preselected .19/budget-120 condition, successes change 15/30→30/30. With ample budget 300 on the same 30 maps, mean examined nodes change 118.7667→36.9667 while both retain mean path length 26.0667. This is a node-expansion result under the stated model, not measured runtime, energy or physical robot performance. All 12 conditions, success gains/losses and post-hoc example paths are preserved in `data/tie-break/` and `TIE_BREAK_RESULTS.md`.

Tie-breaking is established prior work; background and scope are cited in `TIE_BREAK_STUDY_KR.md`. This sample does not prove universal superiority. The study retained the library/CLI FIFO default; the later browser-default choice is recorded below. The student did not give a further numerical interpretation, and code/implementation improvement are not represented as student-authored.

## Student-selected browser default — 2026-10-28

After the comparison, Junmo said **1번째든 2번째든 둘 다 비슷한 것 같기는 한데 굳이 뽑자면 2번.** This is a tentative preference for rule 2, not a supplied rationale, independent alternative proposal or implementation. AI implemented it as the browser demo's initial choice, kept FIFO selectable and retained the library/CLI FIFO default.

The selected mode now reaches both single-map planning and the 30-map benchmark and is recorded explicitly in new JSON configurations. Settings changes invalidate the prior report/export. Korean labels distinguish movement, examined-node budget, budget failure and unreachable maps; successful-route means identify their separate denominators. Browser snapshots deliberately do not invent a source commit or verified student operator. Commit-bound CLI records remain the research provenance source.

All 20 tests passed. AI-operated browser checks reproduced 15/30 A* successes for FIFO and 30/30 for closer-goal on the known .19/budget-120 cohort; both exported rows exactly match the selected core mode, with the same map seeds and unchanged Greedy rows. Default restoration and stale-report/export clearing were observed. Sources, exports, TAP, screenshot and hashes are bound in `data/demo-choice/validation-manifest.json`. Subsequently, after instructions to use rule 2 at budget 120, Junmo reported **30장(100%)** for the A* success count. This is a guided self-reported UI result; a new raw export and the full current settings were not independently observed. Choice and implementation are separately attributed in `DEMO_DESIGN_DECISION.md`.

After instructions to switch only to rule 1 at the same budget 120, Junmo reported **15(50%)** for A* successes. The guided self-reported comparison is therefore FIFO 15/30 versus closer-goal 30/30. Full settings and new raw exports were not independently observed. These reports remain separate from AI acceptance evidence, and no student explanation or universal superiority claim is inferred. The next guided check increases the budget to 300 while retaining rule 1 and the map settings.

After the higher-budget instructions, Junmo reported **30(100%) -> 다음 할 것**. For the instructed FIFO/budget-300 condition, this is a guided self-report of 30/30 successes, compared with 15/30 at budget 120. Full settings and a new raw export were not independently observed. The budget is a ceiling. Asked for actual mean examined nodes, Junmo first supplied the mean-moves row, then reported **118.77칸** after label/unit clarification. This reads a second metric from the same report and does not add an independent run or student-authored explanation. The next comparison switches to rule 2 at the same budget and map settings.

For the instructed rule-2/budget-300 rerun, Junmo subsequently reported **36.97칸** for mean examined nodes, compared with his prior rule-1 reading of 118.77, then **26.07번 · 30장 기준** for mean moves and its successful-map denominator. Both reported mean route lengths are 26.07 over 30 successes. This completes the guided metric reading; full settings and a new export were not independently observed. The assistant's approximately 68.9% reduction calculation concerns node count only, and equal displayed route means do not establish identical paths. No additional independent research dataset is inferred.

After the assistant's summary and a scoped interpretation prompt, Junmo wrote **1번 규칙 -> 2번 규칙으로 바꾸니까 길을 찾은 지도 수가 100%이고 평균 이동 횟수는 비슷한데 검토 칸 수가 확 줄었어**. This is elicited post-result interpretation of the assisted comparison. Assistant clarification is separate: both rules succeeded at budget 300 and displayed mean moves matched; the success-count increase occurred at budget 120. The statement is not a prior forecast, independent method discovery or implementation claim. Exact context is retained in `DEMO_DESIGN_DECISION.md`; preserving the current browser JSON is the next task.

After Junmo reported **저장됨**, the expected rule-2/budget-300 download was located and preserved byte-for-byte in `data/browser-reports/closer-goal-budget300-report-01.json`. The accompanying validation record binds its hash to an exact committed-code replay and matches all 30 A*/30 Greedy metric rows and accepted seeds to the earlier study. This verifies the artifact contents while retaining the browser's null source revision and distinguishing user-reported saving from AI ingestion/validation. It does not independently establish the physical operator or add independent maps. A pre-run expectation for a separate seed cohort is the next guided task.

## Registered follow-up on a separate seed cohort

Junmo responded **2가 적을 것 같아** when asked for a pre-run expectation on the proposed new cohort. This is a directional expectation of lower mean examined-node count for rule 2, informed by the earlier result; no independent rationale or additional outcome prediction is inferred. The AI-authored `experiments/tie-break-validation-02.protocol.json` fixes base seed 20262027, density .19, 16×12, budget 300 and 30 reachable maps for both tie rules. Seed identifiers are beyond the previous matrix's accepted range; this alone does not prove statistical independence. No new-cohort execution was performed by the assistant during registration. Subsequent guided reports are **117.77칸** for FIFO and **33.80칸** for closer-goal. Both expected downloads have now been preserved byte-for-byte and replay-checked: registered settings and core/UI hashes match, accepted seeds match, Greedy rows are unchanged, and all 30 reference/60 A* metric rows and successful paths were verified. Both rules succeed 30/30, with mean moves 26 and identical shortest lengths per map; rule 2 examines fewer nodes on all 30 maps, reducing the mean by approximately 71.30%. This supports the recorded direction on this cohort without establishing universal superiority, measured runtime/energy improvement or additional independent samples from replay. Sampling is 30 accepted from 32 candidates. Browser source revisions remain null and AI validation is distinct from the user's reported operation. Full artifacts and limits are in `TIE_BREAK_VALIDATION_02_RESULTS.md`; the next task selects and designs a structured obstacle case.

## Structured-map follow-up design

Junmo selected **1번**, a goal-side dead end, from two proposed patterns. AI supplied a 7×3 base layout and offered dead-end lengths of 2 or 4 open cells immediately right of S. The next student task is that length choice, followed by a scoped pre-run expectation. This is guided family selection; no independent full-map authorship, code change or prediction is inferred. The design draft and worksheet are `experiments/goal-side-dead-end.design.json` and `STRUCTURED_MAP_TASK_KR.md`. No planner was called for these candidates during preparation, and no result is claimed.

## Student report sections to complete later

1. Student's own question and prior prediction, with timestamp/commit.
2. Student map or implementation change and the reason for it.
3. Raw runs, matched map IDs, budgets, denominators, failures, and test output.
4. A counterexample and explanation of the actual algorithm behavior.
5. A documented revision and a rerun using controlled conditions.
6. Contribution statement identifying mentor/AI assistance precisely.

The sections above distinguish completed simulation checks from planned work and identify the operator and author of each contribution. Physical robot results have not been collected.

## Next gates

- Oct 27: understand the model, complete a small student-owned design/analysis task, preserve evidence.
- Oct 28: paired comparisons, fixed seeds and budgets, at least two failure/counterexample analyses; preserve unsuccessful attempts.
- Oct 29: student interpretation, verified contribution ledger and technical report.
- Nov–Dec: scoped kinematics/controller/uncertainty model; hardware only if obtained and actually tested. Follow `ROBOTICS_ROADMAP.md`.
- Jan: compare simulation and physical outcomes if hardware trials are available; otherwise report simulation sensitivity and model limitations.
