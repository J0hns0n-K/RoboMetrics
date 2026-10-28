# Separate-cohort follow-up — in progress

The [registered protocol](../experiments/tie-break-validation-02.protocol.json) was committed in `a859a3aa4c61abe804f92fb941222919e7a35220` before the first guided result report. Keep that protocol unchanged; record observations here.

## Prediction and conditions

Junmo's exact pre-run response was **2가 적을 것 같아**: a directional expectation of lower mean examined nodes for rule 2, after experience with the original cohort. No rationale or separate success/route-length prediction was supplied.

The instructed conditions are base seed 20262027, 16×12, obstacle-generation probability .19, budget 300 and 30 reachable maps. Run FIFO first, then closer-goal with all other settings fixed. The primary comparison is mean examined nodes over all maps, including capped failures.

## Guided reports

| A* tie rule | Reported mean examined nodes | Success count | Mean moves and successful denominator | Raw export verification |
|---|---:|---|---|---|
| 1 — FIFO | 117.77 | Not yet reported | Not yet reported | Pending |
| 2 — Closer-goal | Pending | Pending | Pending | Pending |

After the FIFO instructions, Junmo replied verbatim **117.77칸**. This is a guided self-reported reading. Full settings, actual accepted seeds, success count and raw rows have not yet been independently inspected. Do not infer an outcome for rule 2 or classify the prediction as supported before collecting its result. The assistant has not generated either new-cohort result during preparation of this note.

## Collection and validation still required

Preserve the current FIFO JSON before changing controls, then collect the rule-2 report and export at the same settings. Validate both files against the registered conditions, compare accepted seeds and unchanged Greedy rows, retain failures, and check path lengths on common successes. Record source/provenance limits separately from verified file contents. Disjoint seed identifiers alone do not establish independent or unique map layouts.

The student supplied the prediction and reported reading; the cohort design, protocol and documentation are AI support. Node counts are not measured runtime, energy or physical robot performance.
