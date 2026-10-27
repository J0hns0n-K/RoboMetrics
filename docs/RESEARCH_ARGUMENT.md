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

## Exact semantics
- Cell movement: four-connected unit cost; no diagonal or orientation, no acceleration, no robot geometry, no motor commands.
- Obstacles: known fully to both algorithms; randomly generated with declared seed and density.
- Reference shortest path: Dijkstra with effectively unlimited expansion budget. Dijkstra is only used to classify a map as solvable and calculate optimal length.
- Experiment is *paired*: both tested algorithms see same preselected solvable maps and same budget. Rejection sampling of unsolvable maps is disclosed and limits generalization.
- `meanPathLength` only across successes. If success rates differ, comparing raw mean lengths between algorithms can mislead; report success rates first, path ratio second, and conditional denominator.
- Expanded nodes: implementation-specific proxy for computation, not CPU cycles, timing, battery usage or optimality in hardware.
- Status: no **real physical experiments**, **measured collision rate**, or **sim-to-real study** in Early.

## Threats to validity
- Greedy and A* are not directly comparable as if both maximize the same objective; trade-off includes search cost and route optimality.
- Map connectivity and obstacle density can bias chosen examples. Simpler problems overstate performance.
- The grid lacks robot footprint, inertia, turn radius, dynamic obstacles, localization drift, wall thickness, sensor noise and motor-controller limits.
- Heuristic tie-break and priority queue implementation may affect search counts, but not theoretical optimality of A* with consistent heuristic.
- Overly small trial count and hand-picked seeds can produce noisy conclusions; disclose sample size and seed list.
- Comparing '0 collisions' in planned grid paths would be misleading: path validity isn't executed collision avoidance.

## Developmental research arc
Early: grid planning trade-offs → Nov: kinematics and sensor uncertainty in simulation → Dec: physical differential-drive robot and repeated trials → Jan (only before target deadlines): compare sim-to-real residuals and carry out controlled ablation. Keep the same benchmark goal and maps wherever meaningful.
