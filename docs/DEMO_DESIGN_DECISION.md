# Demo default choice — 2026-10-28

After the AI-provided tie-rule comparison, Junmo said, verbatim:

> 1번째든 2번째든 둘 다 비슷한 것 같기는 한데 굳이 뽑자면 2번.

This is a **tentative selection of rule 2 as the browser demo default**. The user still regarded the alternatives as similar and did not provide a further rationale. Do not rewrite this as an independent proposal of lower-h ties, a strong superiority claim, or student-authored implementation.

## Implementation by AI

- The browser initially selects `closer-goal`: f=g+h first, then smaller h only at equal f, then insertion order. Original FIFO remains selectable.
- Single-map A* planning and the 30-map benchmark use the same selected rule. Greedy is unchanged.
- `benchmark` now accepts `astarTieBreak` and writes it into `configuration` for new exports. Its library/CLI default remains `fifo`, preserving historical default metrics. The demo's default is selected by HTML, not a silent global planner change.
- Changing any control clears the prior batch/report and disables export until the new batch runs. Report captions identify the settings used.
- Controls and result labels are in Korean, separating moves, examined nodes, budget failure and unreachable maps. Count-based success labels show the numerator and denominator.
- Browser exports are explicitly marked as unverified browser snapshots with generation time and no invented source SHA/operator. Commit-bound CLI datasets remain the research provenance source.

Student contribution is the default-choice response. Alternative rule, implementation, UI copy, tests and browser verification are AI assistance. Earlier baseline and tie-comparison datasets remain unchanged.

## Acceptance checks

Verify the selected default, both rule choices in single-map/batch execution, matching exported rule metadata, report invalidation after a setting change, and restored rule 2 on a new page load. Preserve browser verification separately from student operation. The integration regression checks that both selected modes use the same accepted maps and unchanged Greedy results.
