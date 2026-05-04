# Codex Activity Log — thai-rent-finder

History of Codex auto-fix activities. Newest first.

---

## PR #63 — feat(ci): trigger Codex on site-health issues automatically
**Date:** 2026-05-04T21:16:32Z
**Reviewed commit:** unknown
**Source:** [PR comment](https://github.com/funzi7/thai-rent-finder/pull/63#issuecomment-4374543591)

### Summary
* Tightened the `trigger_codex_on_health_issue` job gate so it only runs for relevant `issues` actions:
  * `opened` events where the issue already includes `site-health`
  * `labeled` events where the newly added label is exactly `site-health` [.github/workflows/codex-auto-fix.ymlL327-L336](https://github.com/funzi7/thai-rent-finder/blob/cdcb8f93ed6c617e7e1b4b8edb8cc8c23584dbf8/.github/workflows/codex-auto-fix.yml#L327-L336)
* This avoids unnecessary workflow runs on unrelated label additions while keeping the existing dedupe/comment logic unchanged. [.github/workflows/codex-auto-fix.ymlL348-L355](https://github.com/funzi7/thai-rent-finder/blob/cdcb8f93ed6c617e7e1b4b8edb8cc8c23584dbf8/.github/workflows/codex-auto-fix.yml#L348-L355)

**Testing**
* ✅ `python3 -m pip install --user pyyaml >/tmp/pip.log && tail -n 5 /tmp/pip.log`
* ✅ `python3 -c "import yaml, pathlib; yaml.safe_load(pathlib.Path('.github/workflows/codex-auto-fix.yml').read_text()); print('ok')"`

Committed on branch `work`:
* `87f3dae` — `fix(ci): scope health trigger to relevant issue actions`

 [View task →](https://chatgpt.com/s/cd_69f90c502cf88191bef44845ee1fe720)

---

## PR #62 — feat(ci): site health workflow + /api/admin/health endpoint
**Date:** 2026-05-04T19:14:50Z
**Reviewed commit:** unknown
**Source:** [PR comment](https://github.com/funzi7/thai-rent-finder/pull/62#issuecomment-4373794444)

### Summary
* Committed the pending lockfile normalization as `chore(lockfile): normalize npm dependency metadata` (`aee0e15`). The update marks multiple transitive packages as `dev: true` and aligns prior `devOptional` markers to `dev`, reducing repeated lockfile churn from npm resolution differences. [package-lock.jsonL59-L66](https://github.com/funzi7/thai-rent-finder/blob/324d2ce9fa4c0fc0434e8ae02685500c737962a4/package-lock.json#L59-L66) [package-lock.jsonL827-L875](https://github.com/funzi7/thai-rent-finder/blob/324d2ce9fa4c0fc0434e8ae02685500c737962a4/package-lock.json#L827-L875)

**Testing**
* ✅ `npx tsc --noEmit` (passed; only emitted an npm warning about unknown env config `http-proxy`).

 [View task →](https://chatgpt.com/s/cd_69f8ef70cda88191963a3b5c38f57970)

---

