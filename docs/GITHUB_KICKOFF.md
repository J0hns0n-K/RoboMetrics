# GitHub kickoff: create the student-owned repository

The available linked GitHub integration at handoff time can read/search and write to **existing** repositories, but **does not expose repository creation**. An actual remote has NOT been created. The local starter is ready to import.

1. Sign into the student's GitHub account and open https://github.com/new .
2. Name: `junmo-robometrics`. Visibility: **Private** initially. Initialize with **no** README to avoid conflicts.
3. Unzip the starter project locally and run tests.
4. In the project root, using Git Bash / terminal:

```bash
git init
git add .
git commit -m "chore: import counselor/AI reference scaffold; not student-authored"
git branch -M main
git remote add origin https://github.com/YOUR-STUDENT-USERNAME/junmo-robometrics.git
git push -u origin main
```

Replace `YOUR-STUDENT-USERNAME` with the actual authenticated account name. No school credentials, API keys, or student records in the repository.

5. Student's subsequent independent work must be in separate commits with meaningful messages and evidence. Recommended first four issues:
   - `Research: preregister hypotheses and threats to validity`
   - `Student task: original map editor or map-family enhancement with tests`
   - `Benchmark: sweep density × budget; export and evaluate counterexamples`
   - `Admissions: verify code attribution, measured results, and 150-char claim`
6. Grant mentor collaborator access only as needed; preserve authorship in commits.

## Repo check
To verify in later student session, inspect the GitHub repo metadata, latest commits, `README.md`, tests and experiment data. Do not claim “repo linked” from a successful ZIP upload alone.
