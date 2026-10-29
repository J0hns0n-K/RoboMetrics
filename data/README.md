# Experiment data

The current datasets contain synthetic grid maps. Preserve seeds, configuration, source revision, test date, runtime environment, operator attribution and raw outcomes with each research run. Browser snapshots without a verified source revision or operator must be identified as such; acceptance manifests can bind archived snapshots to checked source versions.

Do not overwrite previous results. Keep budget failures, rejected-map audits and the denominator used for each summary. Physical robot datasets are future work and must be labeled separately from simulation. Do not commit credentials or identifying personal records.

`browser-reports/` contains downloaded files associated with guided user reports, preserved without editing their bytes. Separate validation records identify content/replay checks and provenance limits. They must not be relabeled as independently observed student execution or new independent map samples.

`retry-policy/` contains separately scoped AI-operated known-case response-policy controls, immutable raw outputs, test archives and validation manifests. The [resume control](retry-policy/resume02-to08-validation-01.json) binds a new state-preserving session to the archived direct/restart arms; archived arms were reused rather than rerun. Tests and known controls are not additional independent map cohorts or student implementation evidence.

`map-updates/` contains explicit old/new map checks followed by fresh static-map planning from the current position. The [current-position control](map-updates/current-position-detour-validation-01.json) preserves the student's pre-run remaining-length prediction, old-path rejection, new path, independent distance, budget, operator and source/test hashes. It is simulation evidence, not an incremental replanner or physical robot data.

`route-update-policy/` contains AI reference-policy tests and known-fixture integration checks for keeping a valid remaining path versus fresh planning and its distinct outcomes. The [validation](route-update-policy/known-controls-validation-01.json) records actual new planner calls, zero-call cases, source/test hashes and provenance. Zero planner expansions excludes route-validation work; no runtime/energy or physical result is implied.

The later [reoptimization validation](route-update-policy/reoptimization-validation-01.json) binds the student-selected default, explicit retention controls, a budget-limited valid fallback, 47-test archive and a separate legacy compatibility rerun. It preserves historical outputs and distinguishes enriched new metadata from matched original result fields.
