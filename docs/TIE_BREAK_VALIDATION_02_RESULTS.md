# Separate-cohort follow-up — paired files validated

The [registered protocol](../experiments/tie-break-validation-02.protocol.json) was committed in `a859a3aa4c61abe804f92fb941222919e7a35220` before the first guided result report. The protocol remains unchanged.

## Prediction and conditions

Junmo's exact pre-run response was **2가 적을 것 같아**: a directional expectation of lower mean examined nodes for rule 2, after experience with the original cohort. No rationale or separate success/route-length prediction was supplied.

Conditions: base seed 20262027, 16×12, obstacle-generation probability .19, budget 300 and 30 reachable maps. FIFO was collected first, followed by closer-goal at the same instructed settings. The primary comparison is mean examined nodes over all maps, including capped failures.

## Results verified from both downloaded files

| A* tie rule | Mean examined nodes, all 30 | Successes | Mean moves, successful maps |
|---|---:|---:|---:|
| 1 — FIFO | 117.77 | 30/30 | 26.00 over 30 |
| 2 — Closer-goal | 33.80 | 30/30 | 26.00 over 30 |

The exact mean difference is 83.96666666666667 examined nodes, or a 71.29917916784603% reduction relative to FIFO. Rule 2 examines fewer nodes on all 30 maps, with no equal or higher-count cases. Both rules succeed on every map and return the same shortest length on each paired map. This does not imply identical routes.

The directional expectation is supported on this cohort. It does not establish a universal gain, statistical independence of maps, measured runtime/energy improvement or physical robot performance. Both means include the same 30 maps; no budget failures occurred in this condition.

## Reports, files and validation

Junmo reported **117.77칸** for FIFO and **33.80칸** after switching to rule 2, then **저장됨** after the second export task. These are guided reports. The assistant separately located and preserved both expected downloads byte-for-byte:

- [FIFO raw JSON](../data/browser-reports/fifo-seed20262027-budget300-report-01.json) and [initial validation](../data/browser-reports/fifo-seed20262027-budget300-report-01.validation.json)
- [Closer-goal raw JSON](../data/browser-reports/closer-goal-seed20262027-budget300-report-01.json)
- [Paired validation, hashes, source revision and sampling](../data/browser-reports/seed20262027-budget300-paired-validation-01.json)

AI validation confirms both complete benchmark payloads reproduce, accepted seeds match, Greedy rows are unchanged, and registered core/UI source hashes still match. All 30 reference rows and 60 A* metric rows were checked; successful A* paths are valid and match reference shortest lengths. Sampling checks agree: 32 candidates, 30 accepted, with seeds 20262039 and 20262057 rejected as unreachable.

Browser source revisions remain null. The recorded validation revision identifies replay code, not a proven browser execution revision or independently observed physical operator. The student's prediction, readings and save report are distinct from AI ingestion, replay, analysis and documentation. There are 30 map pairs and 60 A* calls; validation replays are not additional independent samples. Seed identifiers lie beyond the earlier matrix, which alone does not establish statistical independence or unique layouts.

## Next research step

Challenge the random-map finding with a deliberately structured obstacle layout. Let the student select and then design the next case, record a scoped expectation before running it, and retain unfavorable outcomes. A goal-side dead end or narrow corridor are proposed starting options; no student choice, map design or outcome has been recorded yet.
