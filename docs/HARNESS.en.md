# Jurepi Development Harness

> **English** · [한국어](./HARNESS.md)

Jurepi is built with a development harness made of an **agent team + skills**. With **Clean Architecture (layer separation)** and **TDD (test-first)** as its spine, an orchestrator coordinates layer-specific expert agents to complete each feature. The harness itself lives in the repo under `.claude/` (agents & skills) and `CLAUDE.md` (triggers & change log).

## Single-Source Documents

The harness treats these as the **truth** for requirements, mapping them to layers rather than reinterpreting them.

| Document | Role |
|----------|------|
| `docs/SPEC.md`, `docs/services/**/SPEC.md` | Platform/tool requirements (English = the AI-consumed canonical, `SPEC_KR.md` = Korean translation) |
| `docs/DESIGN.md` | Visual single source (design tokens & components) — mirrored by `src/styles/tokens.css` |
| `PRODUCT.md` | Strategy single source (users, purpose, brand, principles) |

## Team

A **standing build team of 5** plus **2 specialists** called at the right moment. Every agent runs on the `opus` model.

| Agent | Layer | Responsibility | Primary skill |
|-------|-------|----------------|---------------|
| `architect` | Design | Layer decomposition, contracts, task splitting, build order | clean-architecture |
| `domain-engineer` | Domain / use cases | Pure-logic TDD (fairness engine, search, consent, reducers) | jurepi-tdd, clean-architecture |
| `ui-engineer` | Adapter (UI) | React components, hooks, design system, accessibility | design-system-fidelity, jurepi-tdd |
| `platform-engineer` | Framework | App Router, SSG, i18n, SEO infra, ads, build | nextjs-ssg-platform |
| `qa-integration` | Cross-cutting | Boundary cross-checks, E2E, a11y, CWV | integration-qa, jurepi-tdd |
| `seo-geo-engineer` | Discoverability *(specialist)* | Per-tool SEO+GEO (unique meta, JSON-LD, answer-first content, llms.txt, AI crawlers, prerendered exposure) | seo-geo-optimization |
| `deploy-engineer` | Deploy *(specialist)* | Cloudflare static deploy, static-export migration, `_headers`/`_redirects`, troubleshooting | cloudflare-pages-deploy |

> The seo-geo-engineer is invoked **when a tool ships or discoverability is improved**, and the deploy-engineer **at deploy time or on deploy failure** (neither is a standing member).

## Skills

| Skill | Purpose |
|-------|---------|
| `jurepi-build` | **Orchestrator** — team coordination, workflow, verification principles (entry point for all feature work) |
| `clean-architecture` | Layer placement, dependency rules, port/adapter boundaries |
| `jurepi-tdd` | RED→GREEN→REFACTOR, seeded-RNG deterministic domain tests, fairness chi-square |
| `nextjs-ssg-platform` | App Router, SSG, next-intl, SEO infra, Server/Client boundary |
| `design-system-fidelity` | DESIGN.md token fidelity, anti-template, accessibility, state design |
| `integration-qa` | Boundary cross-checks, coverage, E2E, axe, CWV, visual/SSR hard gates |
| `seo-geo-optimization` | Per-tool search-engine (SEO) + generative-engine (GEO) discoverability playbook |
| `cloudflare-pages-deploy` | Static export → Cloudflare deploy procedure & troubleshooting |

## Workflow (per feature, inside-out)

Outer layers are not trusted until the domain is green.

```
1. Design       architect       → layer decomposition + contracts + invariants + task split
2. Domain       domain-engineer → tests RED→GREEN→REFACTOR (fairness/search/consent/reducer)
3. Parallel     ui ∥ platform   → build adapter/framework on top of the contract (each TDD)
4. Discovery    seo-geo-engineer→ per-tool SEO+GEO spec & verify (meta, JSON-LD, answer-first, llms.txt)
5. Incremental  qa-integration  → boundary cross-checks right after each module
6. Integration  qa-integration  → E2E (SPEC scenarios) + a11y + CWV + prerendered SEO/JSON-LD
7. Synthesis    leader          → collect & summarize, name what's unresolved/unverified
```

## Non-Negotiable Gates

- **Clean-architecture dependency rule** — the domain is pure functions with no `react`/`next`/DOM imports.
- **TDD coverage** — domain ≥90% / overall ≥80%, tests before code.
- **Fairness** — uniform permutation first → realized as a ladder; chi-square goodness-of-fit must pass (failure = CRITICAL).
- **Core Web Vitals** — CLS < 0.1 (ad slots reserve height), LCP < 2.5s.
- **Accessibility** — WCAG 2.1 AA, full keyboard operation, `prefers-reduced-motion` respected.
- **Design** — DESIGN.md token fidelity; accent ≠ CTA (accent = identity, brand = action).
- **Discoverability** — anything to be indexed/cited must exist in the **prerendered HTML**, outside the `mounted` gate.

## Verification Principle — Claim ≠ Proof

An agent's "done/PASS" claim is often untrue. **The leader re-runs the core checks before accepting any gate**: re-running `tsc`, the full `pnpm test`, the build, and E2E to confirm the numbers, and for UI directly viewing rendered screenshots and prerendered HTML (`curl`). "Green build/tests ≠ correct screen."

## Deploy

**Deploy = `git push` (production branch `main`).** Cloudflare Workers Builds (Git-connected) detects the push and **automatically runs** `pnpm build` + `wrangler deploy` inside the CF pipeline. You do not run `wrangler deploy` locally (that is CF's internal step); changes on a feature branch/worktree must be merged into `main` to be included. See the `cloudflare-pages-deploy` skill.

## Harness Evolution

The harness evolves itself. After each feature, defects and lessons are routed by type — result quality → skills, roles → agent definitions, ordering → the orchestrator, missing triggers → descriptions. Every evolution is recorded in the **change-log** table in `CLAUDE.md`.

## File Locations

```
CLAUDE.md                 # Harness triggers, composition, change log (evolution record)
.claude/agents/*.md       # 7 agent definitions
.claude/skills/*/SKILL.md # 8 skills (jurepi-build = orchestrator)
docs/SPEC.md, DESIGN.md   # Requirements & visual single sources
PRODUCT.md                # Strategy single source
```
