# RoboMetrics kickoff engineering record

Date: 2026-10-27, Asia/Seoul. **AI-authored preparation record**, not a completed student-authored Engineering Report.

## Evidence and attribution

- Private repository created: `https://github.com/J0hns0n-K/junmo-robometrics`.
- Original 20-file reference commit: `43fa8ec965180532c1fcf4a553309ed350b25277`.
- ZIP SHA256: `211136cc54687af919f897fc4d19f86c25ae0365dd49ceadbc2424f56f646b61`.
- Master Handoff v2 SHA256: `60472771df326048d8a93020a2d808ec7623d8633159b33c0b8ec7610765e432`. Read as project context; school document links were not fetched.
- Baseline executed by AI assistant: Node v24.22.1, Windows x64, original six tests passed.
- New scripts, audit tests, explanatory documents, and example scenario: AI assistance, separate from the original reference import.
- Student evidence: Junmo answered `4` for an open 3×3 corner-to-corner grid, selected the center obstacle from AI-provided options, and predicted `4번` for the resulting grid before execution. See `TASK_01_DECISION.md` and the separately committed scenario. This is a guided obstacle choice and prediction; student-authored code, independent map design, interpretation, and independently operated trials are still pending.

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

The student's path-length prediction agrees with the result. The following interpretation is **AI-written**: on this grid, path lengths match while examined-node counts differ; FIFO ties make A* examine additional equally scored candidates before the goal. This single guided example does not establish general superiority or an implementation improvement. Student interpretation is requested but not yet recorded. No student-authored algorithm change has been made.

## Student report sections to complete later

1. Student's own question and prior prediction, with timestamp/commit.
2. Student map or implementation change and the reason for it.
3. Raw runs, matched map IDs, budgets, denominators, failures, and test output.
4. A counterexample and explanation of the actual algorithm behavior.
5. A documented revision and a rerun using controlled conditions.
6. Contribution statement identifying mentor/AI assistance precisely.

No completion, research improvement, or physical result is claimed here. Early EC wording remains pending actual student work. Existing handoff admissions drafts are conditional examples, not verified accomplishments.

## Next gates

- Oct 27: understand the model, complete a small student-owned design/analysis task, preserve evidence.
- Oct 28: paired comparisons, fixed seeds and budgets, at least two failure/counterexample analyses; preserve unsuccessful attempts.
- Oct 29: student interpretation, verified contribution ledger, report, then truthful EC drafting.
- Nov–Dec: scoped kinematics/controller/uncertainty model; hardware only if obtained and actually tested. Follow `RD_ROADMAP.md`.
- Early Jan: include only work completed by each target's actual submission/update deadline. Target colleges and deadlines have not been supplied or verified.
