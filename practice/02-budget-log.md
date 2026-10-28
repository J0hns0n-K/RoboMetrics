# Practice 02 — saved budget edit before execution

2026-10-27, Asia/Seoul. AI transcription of the user report and saved file diff.

The user reported **저장했어**. The observed diff in `02-planning-budget.mjs` changes only `const budget = 8;` to **`const budget = 5;`**. The same AI-provided center-blocked 3×3 map and original reference search engine remain in use.

Commit the saved edit before execution. This is a guided one-parameter edit and learning check; these map outcomes were explained earlier, and no new student prediction was collected. Student contribution is the reported saved edit observed in the file diff. Script, instructions, map, Git operation, execution and initial interpretation are AI support.

The assistant's initial budget-8 smoke check found A* and Greedy both successful with four-move paths, examining 8 and 5 nodes respectively. Earlier full map results and budgets are also preserved in `data/guided/task-01-run-01.json`.

## Budget-5 execution result

AI operated the saved script on clean source `87720eb451c507c5c423d549889918f815b58e22`. A* examined five nodes and returned `BUDGET_EXCEEDED`, with no successful path. Greedy examined five nodes and returned a verified four-move path. The engine hash matches the earlier center-map record.

Raw stdout: `data/learning/practice-02-budget-5.stdout.txt`. Source hashes, budget, map, operator and environment: `data/learning/practice-02-budget-5.json`.

AI interpretation: limiting examined nodes can change whether a policy finds a path on the same reachable map. Here A* stops before examining the goal; Greedy reaches it within the limit. This does not establish a general algorithm ranking or an implementation improvement. No new student prediction or post-result explanation has yet been supplied.

## 2026-10-28 — saved budget-8 rerun input

The user reported **저장했어/성공하지 않을까**, expressing the expectation that A* would succeed before this rerun. The observed saved diff changes only `budget = 5` to **`budget = 8`**. The map, movement rules and engine are unchanged.

Preserve the edit and response in a commit before execution. This is a guided expectation/check after earlier examples and an explanation of the same map, not a blind independent prediction. The student saved the parameter edit and supplied the tentative expectation; AI supplied the script, instructions and prior explanations, and operates the software.

## Budget-8 rerun result

AI executed the corrected budget on clean source `d8ec3262379930eec7c0cc393fd766a3528fb02a`. Both policies succeeded with verified four-move paths. A* examined 8 nodes; Greedy examined 5. The engine hash matches the recorded budget-5 run.

Raw stdout and metadata are `data/learning/practice-02-budget-8.stdout.txt` and `data/learning/practice-02-budget-8.json`. The user's expectation agrees with this rerun. Comparing the same map at budget 5 and 8 shows A* changing from budget failure to success; Greedy succeeds in both. The response was elicited after the earlier same-map outcome had been explained, so it remains a guided learning check. No new student post-result interpretation has yet been recorded.
