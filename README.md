# RoboMetrics

A reproducible grid-path-planning benchmark comparing A* and Greedy Best-First Search under a limited node-expansion budget. Dijkstra provides a shortest-path reference.

## Run locally

Requires Node.js 18 or later. No dependency installation is needed.

```sh
npm test
npm start
```

Open http://127.0.0.1:8080/ after starting the server.

The Korean browser interface supports obstacle density, map seed, expansion budget, A* tie-breaking selection, a paired 30-map comparison and JSON export. It initially selects the closer-goal tie rule; FIFO remains selectable. The library and CLI retain FIFO as their default.

## Research question

On the same maps and with the same search budget, how do the algorithms differ in finding a route, route length and examined-node count? How much does A* tie-breaking affect these results?

The current model uses fully known static obstacles, four-connected movement and unit costs. Seeds reproduce synthetic maps. The batch benchmark uses reachable-only rejection sampling and records separate denominators for successful-route summaries. Examined nodes are a computation proxy, not measured runtime or energy.

## Results and evidence

- The original FIFO matrix covers three obstacle densities and four budgets: 90 density-specific map entries reused across 360 map/budget pairs and 720 A*/Greedy calls. These larger counts are not independent trials. See [matrix results](docs/MATRIX_RESULTS.md) and [raw data](data/batch/).
- On the same .19-density, budget-120 cohort, A* successes changed from 15/30 with FIFO ties to 30/30 with closer-goal ties. See [tie-breaking study](docs/TIE_BREAK_STUDY_KR.md), [results](docs/TIE_BREAK_RESULTS.md) and [raw data](data/tie-break/). This does not establish universal superiority.
- The browser default follows Junmo's tentative choice of rule 2. [Design decision and acceptance checks](docs/DEMO_DESIGN_DECISION.md) distinguish that choice from AI implementation and operation.
- The current suite contains 20 tests, including an exhaustive comparison against an independently written BFS on 1,024 small-grid obstacle layouts.

## Code and contributions

The initial scaffold was AI-generated and is preserved in reference commit `43fa8ec965180532c1fcf4a553309ed350b25277`. Later AI-written helpers, tests and experiment runs are identified separately from Junmo's actual choices, parameter edits, route construction and interpretations in the [contribution log](docs/CONTRIBUTION_LOG.md). A* and Greedy are established algorithms.

The [engineering record](docs/ENGINEERING_REPORT.md) links results to source commits and records limitations. The current work concerns simulation; physical robot measurements have not been collected.

## Project guide

- [Algorithm review, Korean](docs/ALGORITHM_REVIEW_KR.md)
- [First guided task](docs/TASK_01_KR.md) and [practice exercises](practice/README.md)
- [Research assumptions and limitations](docs/RESEARCH_ARGUMENT.md)
- [Experiment protocol](docs/EXPERIMENT_PROTOCOL.md) and [execution guide](docs/MATRIX_RUN_KR.md)
- [Experiment log](docs/EXPERIMENT_LOG.md) and [data guide](data/README.md)
- [Future robotics research plan](docs/ROBOTICS_ROADMAP.md)
- [Repository workflow](docs/GITHUB_KICKOFF.md)

Source code lives in `src/`, reproducible inputs in `experiments/`, runners in `scripts/`, and tests in `test/`.

Repository: [J0hns0n-K/RoboMetrics](https://github.com/J0hns0n-K/RoboMetrics).
