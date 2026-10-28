# Task 01 — input recorded before execution

Date: 2026-10-27, Asia/Seoul. Transcribed by AI from user chat responses.

- The AI provided an open 3×3 grid and explained orthogonal moves. Junmo answered `4` for its minimum path length.
- With three obstacle positions offered by AI, Junmo selected `가운데 칸` (center cell).
- For the resulting grid, Junmo selected the prior prediction `4번` (four moves) before its execution.
- AI chose budgets 4/5/7/8 after its open-grid reference demonstration, including the goal-examination boundary. These are teaching/verification choices, not a blind preregistration of an algorithm comparison.
- AI transcribed the scenario JSON and this note. Student rationale about why it is four moves and about expansion counts is not yet established. Independent algorithm implementation is pending.

```text
S . .
. # .
. . G
```

Run only after this input has been committed:

```sh
node scripts/run-scenario.mjs experiments/task-01.student.json data/guided/task-01-run-01.json
```

Operator will be the assistant. Store the result as an **assistant-operated, student-guided exercise**, not a student-run independent experiment. Preserve failed budget trials as well as successes. Later interpretation must distinguish the student's actual explanation from AI-written commentary.
