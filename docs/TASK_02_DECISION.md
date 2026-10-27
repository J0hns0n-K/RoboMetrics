# Task 02 — guided detour prediction before execution

Date: 2026-10-27, Asia/Seoul. AI-transcribed decision record.

AI supplied the map below and explained that without walls the same start and goal would be four moves apart. Junmo answered **8** before the map was executed. Only the number is established: a student explanation of the route has not yet been supplied.

```text
S # . . G
. # . # .
. . . # .
```

The map, matched open control, transcription, budgets 5/8/9/15, and software operation are AI assistance. The student's contribution at this stage is the prior path-length prediction. This is a guided example, not independently designed research or student-authored algorithm code.

The open control has the same 5×3 dimensions, start (0,0), goal (4,0), four-neighbor movement and unit step cost. Only the blocked cells change. Do not calculate an obstacle effect by comparing this 5×3 map to the earlier 3×3 exercise.

Both input files and this prediction record must be committed before execution. Preserve successful paths and budget failures, source/input hashes and operator attribution. This exercise does not test whether Greedy returns a longer path than A*; it tests how obstacles can change the minimum path length on matched maps.
