# Practice 01 — first saved attempt

2026-10-27, Asia/Seoul. AI transcription of the user response and observed file diff.

The user reported **저장했어/2**: saved, with a predicted output of 2, before assistant execution.

The observed saved edit was:

```diff
-const before = 8;
-const after = 4;
+const before = 10;
+const after = -8;
```

The function remains the AI-provided `return after - before;`. The actual saved values differ from the exercise target (`before = 8`, `after = 10`). The assistant noticed this before execution, informed the user, and will preserve and run the saved attempt without silently correcting it.

Student contribution: user-reported file edit, observed in the working tree, plus the prior numerical prediction 2. AI assistance: original function, instructions, checking, Git commit, operation and later explanation. This is an arithmetic input-edit exercise, not an algorithm implementation or research result. The time at which the user entered the two values is not independently observed; the saved diff and user report are the evidence.

## Actual execution result

The assistant executed the saved attempt on clean source `472eafd05a36e2d123b857b1298baf3010ed47a4`. Output was **-18**, because the saved expression evaluates as `-8 - 10`. The reported prediction **2** does not match this saved input; it would match the intended `10 - 8` instead.

Raw output: `data/learning/practice-01-attempt-01.stdout.txt`. Source hash, inputs, operator, prior prediction and mismatch are recorded in `data/learning/practice-01-attempt-01.json`. The attempt is preserved. The assistant has not silently changed either input. The next requested student action is to save `const before = 8;` and `const after = 10;` and rerun with the student's prediction of 2.

## Corrected saved attempt — input before rerun

The user subsequently reported **저장했어**. The assistant observed a saved diff changing `before = 10; after = -8;` to **`before = 8; after = 10;`**, exactly following the supplied instructions. The function remains unchanged. Preserve this corrected input in a separate commit before rerunning.

The earlier user response supplied the number 2. The assistant has since explained the calculation and the target result; no new independent prediction is claimed for this correction. The student's contribution is the guided saved input edit. AI provides the function, checking, Git operations and execution. The first failed expectation remains recorded in attempt 01.

## Corrected execution result

The assistant executed the corrected file on clean source `b49ce5334c7e0971788346906bc6ae5defc1818b`. Output was **2**, from `10 - 8`, matching the explained target. A positive difference means the after value is two moves larger in this arithmetic example. This does not describe a new measured map result.

Raw output and metadata: `data/learning/practice-01-attempt-02.stdout.txt` and `data/learning/practice-01-attempt-02.json`. The earlier -18 attempt remains preserved separately. Guided file editing, saving, and assistant-operated rerun are now confirmed; independent algorithm implementation is not claimed.
