# RoboMetrics robotics research roadmap

> Planned research; physical robot experiments have not been performed.

## Current checkpoint — bounded linear path timing and isolated angular profiles, no hardware

Junmo reported on2026-10-29 that no robot is available. Current results use assumed virtual units and analytic models; no physical measurements, actuator calibration, wheel dynamics, sensing or tracking controller have been completed.

The [circular-body reference](DISK_FOOTPRINT_KR.md) and [half-step sampling controls](DISK_RESOLUTION_KR.md) exposed geometric model gaps before any motion claim. The [prospective fixed-seed study](RESOLUTION_PROSPECTIVE_01_KR.md) preserves failures and limits policy conclusions to matched evidence. Endpoint-placement controls and the practice log distinguish student choices/edits/user reports from AI implementation and execution; changing an input goal is not a planner improvement.

The [rotation descriptor](PATH_ROTATION_KR.md), [ideal nominal-time proxy](NOMINAL_PATH_TIME_KR.md) and [analytic1D speed-ramp reference](LINEAR_SPEED_RAMP_KR.md) make orientation, units and instantaneous-rate assumptions explicit. Their known controls are mathematical checks, not hardware validation or a timed differential-drive simulator.

Junmo [selected turns-only intermediate stopping](../data/learning/stop-turn-policy-choice-01.json) expecting faster travel. The [bounded-linear-acceleration reference and paired controls](LINEAR_ACCEL_PATH_TIME_KR.md) now compose rest-to-rest translation profiles, leaving angular rate changes instantaneous. The full tracked test directory passes141checks, and known X/Y controls include both a reduction and an equal-time case. The selected model preserves straight-path timing under collinear resampling. AI supplied the virtual limits/equations/code/checks; the student supplied the model choice and reason.

The student has [interpreted the equal-time countercase](../data/learning/linear-accel-path-interpretation-01.json) through its repeated turns. The [student six-move redesign and source-bound check](../data/learning/linear-accel-route-run-01.json) now reduce required stops and model time at fixed endpoints/length/limits; student arrow design is distinct from AI transcription and operation. The [subsequent one-change student design](../data/learning/linear-accel-route-run-02.json) also removes initial alignment, so the latest change does not isolate internal-turn count alone. The [order-reversal control](../data/learning/linear-accel-initial-order-run-01.json) now contradicts the student equal-time forecast at fixed length/run lengths/internal-turn count: initial alignment still changes model time. The forecast is preserved separately from AI review; no student correction inferred. The [initial-right sensitivity](../data/learning/linear-accel-initial-heading-right-run-01.json) now reverses the route ranking at otherwise fixed conditions and supports the student guided choice of right-first; no reason was supplied. The [isolated angular-profile check](ANGULAR_SPEED_PROFILE_KR.md) now supports the student choice that stopped90+90 is slower than continuous180 at the declared virtual limits; AI owns equations/implementation/operation, and the student supplied no reason. It does not alter existing path timing. The [acceleration-only sensitivity](../data/learning/angular-ramp-accel-sensitivity-run-01.json) now supports the guided smaller-gap forecast under fixed speed/rotations/rest conditions; explanation/operation remain AI support. The [short-angle speed-cap control](../data/learning/angular-ramp-speed-cap-run-01.json) now supports the guided equal-time forecast: the permitted ceiling rises but the achievable peak does not, under the tested angle/acceleration. Student provided no reason; review/operation are AI support. The [long360degree control](../data/learning/angular-ramp-long-angle-cap-run-01.json) now supports the shorter-time forecast at the same acceleration/caps where90degrees tied. This bounds the claim by angle and achievable peak. Next is a [full-path finite-angular penalty forecast](../experiments/bounded-path-angular-01.design.json) before composing the isolated profiles into a separate path reference. Remaining model gaps include composing the isolated angular profiles into path schedules, jerk/steering limits, wheel-based pose integration, tracking error and calibrated physical rates. Keep original instantaneous-time artifacts separate from the new bounded-linear model; no population-level advantage, global fastest path or physical robot performance is established.

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
