# RoboMetrics RD — DEPTH, not feature count

> Planned R&D; no hardware, money spent, sensors, physical tests, awards or real robot outcomes verified yet.

## Nov 2026 — Model gap
- Add robot body shape and differential-drive kinematics, orientation and steering constraints.
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

## Dec 2026–Jan 2027 (subject to actual RD deadlines) — Research deliverable
- Run matched simulated and physical courses; compare completion, path tracking error, duration, contact/failure rates *only if measurable*.
- Calibrate one error source (e.g., wheel-radius mismatch) and run before/after ablation with same conditions and trials.
- Stratify results by environment; confidence intervals/variation, not only best-case anecdotes.
- Write report with model assumptions, methods, figures, uncertainty, negative results and exact contributor roles.
- 1–2 minute demo video with unchanged trial recordings rather than staged performance.
- **Gate:** at least one reproducible physical test and analysis of why simulation did/did not predict behavior.

## Decision rules
- If hardware is not accessible, do not manufacture a sim-to-real study. Instead deepen physics-based simulator, run parameter sensitivity, document as simulation-only. A research report can be strong without claims of hardware, if it is careful.
- If deadline is Jan 1, work after Jan 1 cannot be included in the submitted Jan 1 application. For previously submitted Early colleges, application changes require college-specific update channels and permission; Common App submitted version cannot simply be altered.
- DormSense (CO₂/temp/humidity) is separate: do not stretch RoboMetrics to cover HVAC, and do not launch three shallow apps when one deep experiment is realistic.
