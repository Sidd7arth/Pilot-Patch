# Qloo Verification Commands Catalog

Reproduction commands for Qloo integration and contract tests:

```powershell
# 1. Config check (checks key presence without printing value)
pnpm qloo:verify --step=config

# 2. Authenticated minimal call
pnpm qloo:verify --step=auth

# 3. Entity resolution probe
pnpm qloo:verify --step=resolve

# 4. Market & location semantics probe
pnpm qloo:verify --step=markets

# 5. Evidence strategies test (S1/S2/S3)
pnpm qloo:verify --step=insights

# 6. Full Phase 0 verification suite
pnpm qloo:verify --step=all

# 7. Capture sanitized live fixtures
pnpm qloo:capture

# 8. Opt-in live test suite
pnpm test:live
```
