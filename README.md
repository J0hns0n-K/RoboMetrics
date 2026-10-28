# RoboMetrics — Junmo's Engineering EC R&D

## Live kickoff — updated 2026-10-28

- Current remote: `J0hns0n-K/RoboMetrics`, confirmed **public** on 2026-10-27. The repository was initially created private as `junmo-robometrics`; GitHub now redirects that former address to `RoboMetrics`. The local remote has been updated to the canonical URL. Historical creation records below retain the original name and visibility at creation.
- Original 20-file ZIP preserved in reference commit `43fa8ec965180532c1fcf4a553309ed350b25277`.
- Start here: [first engineering task, Korean](docs/TASK_01_KR.md), [algorithm review](docs/ALGORITHM_REVIEW_KR.md), [current engineering record](docs/ENGINEERING_REPORT.md).
- New audit tests and helpers are **AI-authored support**. Junmo selected a center obstacle, predicted four moves, and interpreted the result: an obstacle need not increase the minimum distance. On the AI-selected Greedy counterexample he later supplied a valid alternative eight-move route on the unchanged map. Exact student inputs and assistant-operated verification are in `experiments/` and `data/guided/`. Student algorithm implementation and independently operated experiments remain pending.
- No dependency installation: `node --test` runs tests; `node scripts/serve.mjs` previews the original UI at `http://127.0.0.1:8080`.
- Fixed-map example: `node scripts/run-scenario.mjs experiments/reference-open-grid.json data/reference/open-grid-run-02.json`. Each output must use a new name.
- The original handoff below is a historical snapshot; its remote-not-created status has been superseded by this section.
- Guided follow-up: Junmo predicted 8 moves on an AI-supplied 5×3 detour map before execution. Matched assistant-operated runs confirmed 4 moves without walls and 8 with walls; see `docs/TASK_02_DECISION.md` and `data/guided/task-02-*-run-01.json`. The prediction is student input; the map and software operation are AI support.
- Guided revision: Junmo chose wall 1 for removal and predicted four moves before execution. The assistant-operated single-cell comparison confirmed 8→4 moves; see `docs/TASK_03_DECISION.md` and `data/guided/task-03-comparison.json`. This is a student-selected environment revision, not a search-code change.
- AI-selected path-quality reference: seed 260 on 5×5 gives A* 8 moves/20 examined nodes vs Greedy 12 moves/14 nodes. The reference-stage 13 tests passed. Selection occurred after inspecting results; the student later supplied a different valid eight-move path on the unchanged map. See `docs/COUNTEREXAMPLE_01_KR.md` and `data/guided/task-04-route-check.json`.
- Full matrix now executed by AI with recorded student expectations: 12 conditions, 90 density-specific cohort entries reused for 360 map/budget pairs and 720 A*/Greedy calls; all 16 tests passed. Raw data, rejection audits, CSV, TAP and three case reports are in `data/batch/`; read `docs/MATRIX_RUN_KR.md` and `docs/MATRIX_RESULTS.md`. Student said success-frequency expectations were unknown; student post-result analysis remains pending. Counts are not independent trials, and student implementation is not claimed.

**Status:** 2026-10-27 counselor/AI-created **kickoff reference scaffold**, NOT verified student-authored research.
**Declared track:** Early browser-native *path-planning benchmark* (Oct 27–29), with a separately scoped RD *sim-to-real robotics* study (Nov–Dec and Jan only if deadlines permit).
**Intended major:** Computer Engineering (verified in Junmo's Common App working document).

## Project thesis
> Under a limited search budget and the same obstacle map, what reliability–path-efficiency trade-off emerges between A* and Greedy Best-First Search, and how might conclusions change when the simulator is later connected to a physical mobile robot?

A* and Greedy are established algorithms, **not original inventions**. Early measures *grid-based global path planning*, **not** robot motor control, collision avoidance, sensor accuracy, or physical navigation. RD can investigate a simulation-to-reality gap using reproducible test environments and a physical robot.

## Run locally

Node 22 is helpful for tests but a package manager is not required.

```sh
# From repository root: serve static ES modules, then open http://localhost:8080
python3 -m http.server 8080

# Tests in another terminal (Node >=18)
node --test test/*.test.mjs
```

No backend, IoT device, personal data, model API, accounts, cloud token, or school CORE integration required.

## What the current scaffold actually contains
- Two-dimensional grid with randomly generated **synthetic** obstacles and reproducible integer seeds.
- Three search implementations: A*, Greedy Best-First, Dijkstra (reference shortest-path baseline).
- Browser map visualization and controls for density, seed, node expansion budget.
- Paired A* vs Greedy trials on the *same* solvable generated maps; metrics: solve rate with computation budget, route length, ratio to Dijkstra shortest path, number of expanded nodes.
- JSON export of individual trial rows and their parameters.
- Six passing Node unit tests at handoff creation.

**This scaffold is mentor/AI-produced reference work.** A student must directly inspect, explain, validate, modify, and test any code they subsequently claim to have developed. Log actual student decisions, commits, code review, hours, datasets, and experiment results in `docs/CONTRIBUTION_LOG.md` and `docs/EXPERIMENT_LOG.md`. Use precise acknowledgment of assistance.

## Day-by-day priorities

| Day | Date | Student-owned priority | Gate |
|---|---|---|---|
| 1 | Tue Oct 27 | Confirm research problem, inspect algorithms and implement one original change/feature, create GitHub repository with student's account | Can explain algorithm, own commit, tests |
| 2 | Wed Oct 28 | Improve evaluation fairness; add map families or additional budget regimes, tests | Reproducible paired experiments and counterexamples |
| 3 | Thu Oct 29 | Run controlled experiments, examine failed cases, write short technical report and record personal contribution | Verifiable results, repo history, no physical robot claims |

Early application date **varies by university**; an Oct 31 internal checkpoint is NOT a verified admissions deadline.

## Docs
- [`docs/HANDOFF_CURRENT.md`](docs/HANDOFF_CURRENT.md) — full cross-project counselor/student kickoff.
- [`docs/RESEARCH_ARGUMENT.md`](docs/RESEARCH_ARGUMENT.md) — falsifiable thesis, baselines, limitations, existing work.
- [`docs/EXPERIMENT_PROTOCOL.md`](docs/EXPERIMENT_PROTOCOL.md) — preregistered trial grid, metrics, test cases, audit process.
- [`docs/CONTRIBUTION_LOG.md`](docs/CONTRIBUTION_LOG.md) — student vs mentor contribution attribution.
- [`docs/RD_ROADMAP.md`](docs/RD_ROADMAP.md) — hardware and sim-to-real plan.
- [`docs/ADMISSIONS_HANDOFF.md`](docs/ADMISSIONS_HANDOFF.md) — Early/RD claim guardrails and 150-char drafts.
- [`docs/GITHUB_KICKOFF.md`](docs/GITHUB_KICKOFF.md) — initial remote creation and issue plan.

## GitHub
Repo name proposed: `junmo-robometrics` (student-owned **private** repo preferred). **Not created remotely by this preparation.** Do not conflate this with DICS school repositories.

## Non-negotiable scope distinctions
1. The **existing school penalty-points app** is a separate student/teacher/peer collaboration, not RoboMetrics.
2. WIS 2024 proves participation and co-presentation, not that Junmo engineered a robot.
3. FlowBench models school check-in queues; RoboMetrics benchmarks path search; neither is a deployed robot.
4. No fabricated claims about user counts, prototypes, papers, performance gains, sensor precision, or admission outcomes.
