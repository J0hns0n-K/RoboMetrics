# Research argument — not a product novelty claim

## Literature-grounded context
- Classical **A*** uses path cost to date plus an admissible heuristic. On a four-connected uniform grid with Manhattan heuristic, it can find a shortest path when unbounded by a search limit.
- **Greedy Best-First Search** favors the heuristic and can expand far fewer nodes but does not guarantee shortest paths.
- Published robotics navigation benchmarking already considers success, path length, computational effort and simulation-to-reality discrepancies. **This idea is educational replication and contextual validation, not an invented benchmark metric.**

Reading:
- ROSNavBench, *Robotics* 15(10), 186, published Sep. 29, 2026: https://www.mdpi.com/2218-6581/15/10/186
- 3we benchmark metrics (success, SPL, duration) https://docs.3we.org/leaderboard/
- Recent multi-metric navigation reliability study: https://www.sciencedirect.com/science/article/pii/S2215098626002508

## Falsifiable statements to test, not claim as results
- **H1:** At a high enough expansion budget, A* will find the same shortest path length as Dijkstra on all reachable maps in the declared four-connected uniform-cost test set.
- **H2:** At equal low expansion budgets, Greedy may solve more routes than A*, but among successful trials may produce longer-than-optimal paths. Record trials that contradict expectations.
- **H3:** An apparent improvement may reverse by map family or obstacle density; plot sensitivity rather than cherry-pick.

## Exact semantics of the original point-grid benchmark
- Cell movement: four-connected unit cost; no diagonal or orientation, no acceleration, no robot geometry, no motor commands.
- Obstacles: known fully to both algorithms; randomly generated with declared seed and density.
- Reference shortest path: Dijkstra with effectively unlimited expansion budget. Dijkstra is only used to classify a map as solvable and calculate optimal length.
- Experiment is *paired*: both tested algorithms see same preselected solvable maps and same budget. Rejection sampling of unsolvable maps is disclosed and limits generalization.
- `meanPathLength` only across successes. If success rates differ, comparing raw mean lengths between algorithms can mislead; report success rates first, path ratio second, and conditional denominator.
- Expanded nodes: implementation-specific proxy for computation, not CPU cycles, timing, battery usage or optimality in hardware.
- Status: no **real physical experiments**, **measured collision rate**, or **sim-to-real study** in the current grid benchmark.

## Later body-aware policy condition

The later [disk and sampling investigation](DISK_RESOLUTION_KR.md) retains the original world/obstacle units while restricting candidate centers using an assumed disk and margin. Its separate policy can stop on a coarse success or refine once after graph exhaustion; this is different from the original A*/Greedy point-grid comparison. Graph-optimal coarse paths can exceed fine-graph lengths, and neither claim implies continuous-motion optimality.

The [unfiltered follow-up protocol](../experiments/resolution-policy-unfiltered-01.protocol.json) fixes its generated sample count/seeds before execution and retains all generated failures. Independent BFS labels graph reachability only with valid body-clearance endpoints, without filtering the cohort. [Results and validation](../data/footprint/resolution-policy-unfiltered-validation-01.json) report primary all-map, endpoint-valid and joint-success denominators separately. Maximum allowed work differs by policy because the staged policy permits two searches. Do not interpret node counts alone, zero-search invalid endpoints or a tiny total-count difference as measured efficiency. Earlier [hypothetical mix arithmetic](../data/footprint/resolution-policy-mix-validation-01.json) reuses two known layout costs; it is not a new cohort or an observed workload distribution.

## Threats to validity
- Greedy and A* are not directly comparable as if both maximize the same objective; trade-off includes search cost and route optimality.
- Map connectivity and obstacle density can bias chosen examples. Simpler problems overstate performance.
- The original point-grid benchmark lacks robot footprint, inertia, turn radius, dynamic obstacles, localization drift, wall thickness, sensor noise and motor-controller limits. Later assumed disk geometry addresses a limited footprint gap only; it adds no motion, sensing or measured hardware.
- Heuristic tie-break and priority queue implementation may affect search counts, but not theoretical optimality of A* with consistent heuristic.
- Overly small trial count and hand-picked seeds can produce noisy conclusions; disclose sample size and seed list.
- Comparing '0 collisions' in planned grid paths would be misleading: path validity isn't executed collision avoidance.

## Developmental research arc
Grid planning trade-offs → assumed body geometry, candidate representation and policy validation (current) → kinematics and sensor uncertainty in simulation → physical differential-drive robot and repeated trials if hardware is available → compare simulation-to-reality residuals and carry out controlled ablation. Keep the same benchmark goal and maps wherever meaningful.
