# Skill: review

Review recent changes to index.html for bugs, security issues, and Hebrew RTL correctness.

## Steps
1. Run `git diff HEAD~1` to see recent changes
2. Check for: JS errors, XSS risks, broken RTL layout, missing `updateUI()` calls after state mutation
3. Verify currency conversions go through `toILS()`
4. Report issues concisely in Hebrew
