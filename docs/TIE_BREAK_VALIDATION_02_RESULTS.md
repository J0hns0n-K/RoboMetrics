# Separate-cohort follow-up — in progress

The [registered protocol](../experiments/tie-break-validation-02.protocol.json) was committed in `a859a3aa4c61abe804f92fb941222919e7a35220` before the first guided result report. Keep that protocol unchanged; record observations here.

## Prediction and conditions

Junmo's exact pre-run response was **2가 적을 것 같아**: a directional expectation of lower mean examined nodes for rule 2, after experience with the original cohort. No rationale or separate success/route-length prediction was supplied.

The instructed conditions are base seed 20262027, 16×12, obstacle-generation probability .19, budget 300 and 30 reachable maps. Run FIFO first, then closer-goal with all other settings fixed. The primary comparison is mean examined nodes over all maps, including capped failures.

## Guided reports

| A* tie rule | Reported mean examined nodes | Success count | Mean moves and successful denominator | Raw export verification |
|---|---:|---|---|---|
| 1 — FIFO | 117.77 | 30/30, verified file | 26.00 moves over 30 successes, verified file | Archived and replay-checked |
| 2 — Closer-goal | 33.80 | Not yet reported | Not yet reported | Pending |

After the FIFO instructions, Junmo replied verbatim **117.77칸**. After instructions to save FIFO, change only the tie rule and rerun, he reported **33.80칸** for rule 2. The reported direction agrees with his prior expectation; the assistant calculates approximately 71.3% fewer examined nodes from the displayed means. This preliminary comparison does not yet verify the paired raw files, rule-2 success count or route quality, and it is not a runtime or energy result.

The expected FIFO download was subsequently located and preserved byte-for-byte as [raw JSON](../data/browser-reports/fifo-seed20262027-budget300-report-01.json), with a [validation record](../data/browser-reports/fifo-seed20262027-budget300-report-01.validation.json). It matches the registered configuration, reports 30 A* successes and mean moves 26, and exactly reproduces the current benchmark payload. AI replay verified all 30 reference rows, 30 A* metric rows and 30 Greedy metric rows, valid successful paths and shortest successful A* lengths. Sampling checked 32 candidates, accepting 30 and rejecting seeds 20262039 and 20262057. Registered core/UI source hashes still match. This is validation of the downloaded file, not additional independent trials or independently observed browser operation. The browser source revision remains null. Rule-2 raw contents have not been inspected or replayed yet.

## Collection and validation still required

Save the current rule-2 JSON before changing controls. Validate that file against the registered conditions and compare it with the archived FIFO file: accepted seeds, unchanged Greedy rows, successes/failures, and path lengths on common successes. Record source/provenance limits separately from verified file contents. Disjoint seed identifiers alone do not establish independent or unique map layouts. The registered protocol remains unchanged.

The student supplied the prediction and reported reading; the cohort design, protocol and documentation are AI support. Node counts are not measured runtime, energy or physical robot performance.
