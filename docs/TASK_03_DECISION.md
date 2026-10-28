# Task 03 — single-wall revision and prediction before execution

Date: 2026-10-27, Asia/Seoul. AI transcription of the student's direct chat answer.

After the AI numbered the four walls in the task-02 detour map and asked which one to remove, Junmo answered **1번 벽/4번**. This selects wall 1 at zero-based coordinate (1,0), immediately right of S, and predicts a minimum of four moves.

```text
Before        Student-selected revision
S # . . G     S . . . G
. # . # .     . # . # .
. . . # .     . . . # .
```

Only (1,0) changes from blocked to free. Keep dimensions 5×3, start (0,0), goal (4,0), unit-cost four-neighbor motion, all three algorithms, and teaching budgets 5/8/9/15 unchanged. Compare to `data/guided/task-02-detour-run-01.json`; check that both runs use the same engine hash even though their input commits differ.

Commit the scenario and the prediction before execution. Student contribution at input time was the guided choice of map revision and its prior numerical prediction. AI supplied the starting map and task, transcribes files, operates software and writes the comparison. Removing a wall changes the environment; it is not a search-algorithm implementation improvement. At the time of the input commit, no student rationale about why this wall helps had been supplied.

## Student explanation after execution and discussion

After seeing the 8→4 result and the assistant's route explanation, Junmo wrote in chat, verbatim:

> 그 1번 벽이 최소 이동 루트를 막고 있었어. 다른 벽들은 그 최소 이동 루트에 관여하지 않았고

This is the student's elicited explanation after results, not a rationale recorded before execution. It is consistent with the map: wall 1 blocks the top-row four-move route; the remaining walls are outside that route. This interpretation is specific to these endpoints and layout. It does not imply that those walls are irrelevant for every map or start/goal configuration.

The explanation was transcribed by AI. The choice, prediction and this explanation are student contributions within a guided exercise; software operation, original map and implementation are separately attributed to AI.
