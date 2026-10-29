// AI-authored response-policy prototype; core planner and benchmark are unchanged.
import {plan, verifyPath} from './core.mjs';

export function planAStarWithOneRetry(map, {
  initialBudget, retryBudget, maxTotalExpansions, tieBreak = 'fifo'
} = {}) {
  for (const value of [initialBudget, retryBudget, maxTotalExpansions]) {
    if (!Number.isSafeInteger(value) || value < 1) {
      throw new Error('Budgets and total cap must be positive safe integers.');
    }
  }
  if (retryBudget <= initialBudget) throw new Error('Retry budget must exceed the initial budget.');
  if (initialBudget + retryBudget > maxTotalExpansions) {
    throw new Error('Combined attempt budgets exceed the declared total cap.');
  }

  const attempts = [];
  const attempt = budget => {
    // A complete restart; no frontier or search work is silently reused.
    const result = plan(map, 'astar', budget, {tieBreak});
    if (result.success && !verifyPath(map, result.path)) throw new Error('Invalid returned path.');
    attempts.push({number: attempts.length + 1, budget, result});
    return result;
  };

  const first = attempt(initialBudget);
  if (!first.success && first.reason === 'BUDGET_EXCEEDED') attempt(retryBudget);
  const totalExpanded = attempts.reduce((sum, a) => sum + a.result.expanded, 0);
  if (totalExpanded > maxTotalExpansions) throw new Error('Actual work exceeds the declared total cap.');

  return {
    label: 'SEPARATE A* RESPONSE POLICY; NOT A FIXED-BUDGET BENCHMARK ROW',
    policy: {initialBudget, retryBudget, maxTotalExpansions, maximumRetries: 1, tieBreak},
    initialBudgetSuccess: first.success,
    retried: attempts.length === 2,
    attempts,
    totalExpanded,
    totalBudgetAllocated: attempts.reduce((sum, a) => sum + a.budget, 0),
    finalResult: attempts.at(-1).result
  };
}
