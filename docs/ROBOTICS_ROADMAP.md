# RoboMetrics robotics research roadmap

> Planned research; physical robot experiments have not been performed.

## Current checkpoint — assumed geometry only

On 2026-10-29, Junmo reported that no robot is available yet. The first [circular-body geometry reference](DISK_FOOTPRINT_KR.md) now checks excluded center cells and swept straight edges in assumed cell-side units, with [source-bound controls](../data/footprint/disk-footprint-corridor-validation-01.json). This completes a limited geometric check, not robot motion, a controller, calibration or a physical trial. Shape, radii/margins, contact convention, code/tests and operation are AI support; the student's input at the initial geometry stage was hardware context only. Junmo subsequently chose the offered virtual margin0.15 and supplied a pre-run width2 geometric expectation. The [two-cell control](TWO_CELL_DOORWAY_KR.md) supports that expectation with a continuous witness while the original center graph reports UNREACHABLE. Junmo selected intermediate candidates; the [half-step control](DISK_RESOLUTION_KR.md) now recovers a valid route while retaining the original world, obstacles, body and margin. A budget-only increase retains the graph failure. This is a known-map geometry result with79 passing tests, not a general efficiency or physical-robot result. Next is a student interpretation followed by separately registered resolution/generalization checks.

## Nov 2026 — Model gap
- Extend the assumed circular-body reference with differential-drive kinematics, orientation and steering constraints; choose measured units only if hardware measurements become available.
- Route paths through controller that tracks waypoints; report deviations, route completion and simulated contact events.
- Test synthetic variations of slip, wheel imbalance, encoder error, obstacle map error and sensing delay one at a time.
- Produce explicit schematic, equations, dimensional units and unit tests.
- **Gate:** simulated robot motion verified on simple known scenarios; planner and controller failure modes separated.

## Late Nov–Dec 2026 — Physical robot feasibility
- Select low-cost safe wheeled robot/kit only after verifying school resources/permissions and budget.
- Bench test motor control in a controlled, low-speed area; use physical emergency stop; avoid stairs, crowded halls, student tracking and facial/biometric data.
- Test repeatable runs of selected simple courses; fixed start/goal, mark obstacles; use fixed lighting and surface conditions initially.
- Record video and logs where consent/privacy permits; no bystanders' identities.
- **Gate:** hardware actually runs and repeated results independently verify computed route length/time; discrepancies documented rather than hidden.

## Dec 2026–Jan 2027 — Research deliverable
- Run matched simulated and physical courses; compare completion, path tracking error, duration, contact/failure rates *only if measurable*.
- Calibrate one error source (e.g., wheel-radius mismatch) and run before/after ablation with same conditions and trials.
- Stratify results by environment; confidence intervals/variation, not only best-case anecdotes.
- Write report with model assumptions, methods, figures, uncertainty, negative results and exact contributor roles.
- 1–2 minute demo video with unchanged trial recordings rather than staged performance.
- **Gate:** at least one reproducible physical test and analysis of why simulation did/did not predict behavior.

## Decision rules
- If hardware is not accessible, do not manufacture a sim-to-real study. Instead deepen physics-based simulator, run parameter sensitivity, document as simulation-only. A research report can be strong without claims of hardware, if it is careful.
