# Agentic IDE — Engineering Roadmap

## Phased Execution Roadmap

```
Phase 0: Code-OSS Fork & Rebrand ──► Phase 1: Single-Agent MVP ──► Phase 2: Confidence Router
     (2–3 Weeks)                      (4–6 Weeks)                      (4–6 Weeks)
                                                                            │
Phase 4: Browser-in-the-Loop ◄── Phase 3: Multi-Agent & Mission Control ◄───┘
     (4 Weeks)                        (6–8 Weeks)
```

---

## Phase Breakdown

### Phase 0 — Fork & Rebrand (Duration: 2–3 Weeks)
- **Goal:** Establish a pristine Code-OSS editor fork stripped of Microsoft telemetry and branded for distribution.
- **Key Deliverables:**
  - Build script setup using `vscodium/vscodium` build scripts.
  - OpenVSX extension marketplace integration.
  - Branded UI shell, splash screen, activity bar branding.
  - Automated CI/CD build matrix for macOS (ARM64/x64), Linux, and Windows.

### Phase 1 — Single-Agent MVP & Diff Verification (Duration: 4–6 Weeks)
- **Goal:** Deliver single-agent prompt capabilities with robust diff validation.
- **Key Deliverables:**
  - Integrated Chat & Composer UI panels in Electron main process.
  - Provider-agnostic BYOK model adapter (OpenAI, Anthropic, Gemini, Ollama).
  - Tool-use framework: file read/write, bash execution, LSP query.
  - Inline diff preview with accept/reject gutter controls and shadow workspace snapshots.

### Phase 2 — Confidence-Scored Hybrid Router (Duration: 4–6 Weeks)
- **Goal:** Implement the primary technical differentiator — fast-path deterministic resolution.
- **Key Deliverables:**
  - Intent classification engine with confidence scoring heuristics.
  - LSP & Tree-sitter fast-path integration for zero-cost instant renames, references, and AST refactors.
  - Instrument telemetry for fast-path vs. LLM escalation split tracking.

### Phase 3 — Multi-Agent System & Mission Control (Duration: 6–8 Weeks)
- **Goal:** Enable multi-agent parallel execution across workspace files with state management.
- **Key Deliverables:**
  - Task planner & subagent spawner for background feature creation.
  - Mission Control dashboard for agent task queue monitoring.
  - Immutable state checkpointing with 1-click snapshot rollback.

### Phase 4 — Browser-in-the-Loop (Duration: 4 Weeks)
- **Goal:** Integrate Playwright-driven visual UI testing agents.
- **Key Deliverables:**
  - Embedded browser window with Chrome DevTools Protocol (CDP) hooks.
  - Automated visual screenshot inspection & spec verification loop for web apps.
