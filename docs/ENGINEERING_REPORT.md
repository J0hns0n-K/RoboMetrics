# RoboMetrics kickoff engineering record

Date: 2026-10-27, Asia/Seoul. **AI-authored preparation record**, not a completed student-authored Engineering Report.

## Evidence and attribution

- Private repository created: `https://github.com/J0hns0n-K/junmo-robometrics`.
- Original 20-file reference commit: `43fa8ec965180532c1fcf4a553309ed350b25277`.
- ZIP SHA256: `211136cc54687af919f897fc4d19f86c25ae0365dd49ceadbc2424f56f646b61`.
- Master Handoff v2 SHA256: `60472771df326048d8a93020a2d808ec7623d8633159b33c0b8ec7610765e432`. Read as project context; school document links were not fetched.
- Baseline executed by AI assistant: Node v24.22.1, Windows x64, original six tests passed.
- New scripts, audit tests, explanatory documents, and example scenario: AI assistance, separate from the original reference import.
- Student evidence: when asked for the minimum moves on an open 3×3 corner-to-corner grid, Junmo answered `4` in chat. No student-authored code, student-designed obstacle map, or independently executed trial has yet been established.

## Question and method

Start by distinguishing number of moves from number of examined nodes. Then let the student design an obstacle map, record an explanation/prediction before execution, and compare unlimited and budgeted runs. A later counterexample task examines Greedy's path quality.

Algorithm validation: keep `src/core.mjs` unchanged; compare all 1,024 obstacle assignments on a 4×3 grid to an independently written BFS; verify exact budget boundaries and valid paths. The initial Dijkstra baseline alone is not independent because it shares the search engine with A*.

Execution artifacts under `data/reference/` are assistant-run reference checks. Their source commit, input/source hashes, environment, timestamps, and dirty-workspace state are recorded. They are not student-run experimental evidence. A clean source commit identifies code; generating a result file creates a later artifact commit.

## Results and interpretation

The original six tests passed at kickoff. Additional audit results and the reference open-grid result are preserved in `data/reference/` when executed. Record exact results from those files, without treating finite test coverage as proof for all maps.

One simple map cannot establish that an algorithm is universally better. Expansion count is not elapsed time. The original random benchmark uses reachable-only rejection sampling; route length summaries condition on success. Neither this grid nor its metrics describe physical robot performance.

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
