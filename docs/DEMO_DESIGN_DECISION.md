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

## Verified implementation

AI browser acceptance checks are archived under `data/demo-choice/`. Their exact committed source revision and hashes are recorded in `data/demo-choice/validation-manifest.json`.

All 20 tests passed. On seed base 20261027, density .19, budget 120 and 30 maps, browser exports show FIFO A*=15/30 and closer-goal A*=30/30, with Greedy unchanged at 30/30. Both exports exactly match core execution for their recorded rule and share identical map seeds. Controls reset the old report and disable export until rerun; reloading restores rule 2. The UI is left ready at rule 2/budget 120, awaiting the student's own button click.

The two browser runs and screenshot are AI verification, not student execution. Browser snapshots intentionally have no invented source SHA; the separate acceptance manifest binds these archived snapshots to the verified code. A future student-operated browser export is a separate event and must not be inferred from these checks.

## Subsequent student report — 2026-10-28

After instructions to set budget 120, run the 30-map comparison with the selected rule 2 and report A*'s success count, Junmo replied verbatim:

> 30장(100%)

This records a guided, self-reported A* result of 30/30. It is separate from the archived AI acceptance checks. The current button operation, full settings and a new raw export were not independently observed, and no independent replication, general success probability or student code authorship is inferred. The next guided comparison switches only the A* tie rule to rule 1 while holding the other settings fixed.

After instructions to select rule 1, retain budget 120 and other settings, and rerun the 30-map comparison, Junmo replied verbatim:

> 15(50%)

This records the guided, self-reported FIFO A* result of 15/30. Together with the prior report, the reported counts are rule 1: 15/30 and rule 2: 30/30 under the instructed budget-120 comparison. Full settings and a new raw export were not independently observed. This does not supply a student explanation, independent dataset or general algorithm ranking. The next guided task changes only the budget to 300 while retaining rule 1 and the same map settings.

After those budget-300 instructions, Junmo replied verbatim **30(100%) -> 다음 할 것**. This records guided, self-reported FIFO A* successes of 30/30, compared with the prior 15/30 at budget 120. Full settings and a new raw export were not independently observed. The success report does not measure actual examined-node counts or establish general success probability. The next task reads A*'s mean examined-node count from the current report before changing settings.

When asked for that metric, Junmo first supplied the mean-moves row, **26.07번 · 30장 기준**. After label/unit clarification, he reported **118.77칸** for A* mean examined nodes. This is a guided self-reported reading from the existing rule-1/budget-300 report, not another experiment. Full settings and a new export were not independently observed. The next comparison retains budget 300 and map settings, switches to rule 2, reruns and reads the same metric; no outcome or student explanation is inferred in advance.

After those rule-2/budget-300 instructions, Junmo reported **36.97칸**. The reported mean examined-node comparison is therefore FIFO 118.77 versus closer-goal 36.97. Full settings, current success count and a new raw export were not independently observed. The assistant calculates an approximately 68.9% reduction in this reported node-count metric; it is not a runtime/energy measurement or a student-authored interpretation. The next guided task reads mean moves and its denominator from the current report to check route quality alongside search work.

Asked for mean moves and the successful-map denominator from that report, Junmo replied **26.07번 · 30장 기준**. Both rules' reported means are therefore 26.07 moves across 30 successes at the instructed budget 300, alongside reported examined-node means 118.77 and 36.97. This reads another metric from the same report; full settings and a new export were not independently observed. It does not prove identical paths or universal gains. The next task requests the student's own scoped interpretation of the two metrics; the assistant's explanation remains separately attributed.

## Guided student interpretation

After the assistant's table and explanation, Junmo wrote:

> 1번 규칙 -> 2번 규칙으로 바꾸니까 길을 찾은 지도 수가 100%이고 평균 이동 횟수는 비슷한데 검토 칸 수가 확 줄었어

This is his elicited post-result interpretation following guided assistance. It recognizes full success with rule 2, similar route lengths and lower examined-node counts; it is not an independent alternative proposal, pre-run prediction or code contribution. The assistant separately clarifies the scope: at budget 300 both rules succeed on 30/30, and both displayed mean route lengths equal 26.07. The success-count increase occurred at budget 120. The quote is preserved without rewriting that distinction into the student's words. The next task saves the current rule-2/budget-300 JSON; no new export has yet been inspected.

## Subsequent raw-file verification

Junmo then reported **저장됨**. The expected downloaded file was located and archived byte-for-byte in `data/browser-reports/closer-goal-budget300-report-01.json`, with a separate validation record. Its configuration and summary support the reported rule-2/budget-300 readings. AI replay exactly matches the benchmark payload; all accepted seeds and 30 A*/30 Greedy rows match the historical tie study. Contents are verified, while the physical click/operator and original browser execution revision remain unrecorded; the browser's null source revision is retained. This event adds a preserved browser artifact, not independent maps or student code authorship. Next comes a pre-run expectation for a separate seed cohort.
