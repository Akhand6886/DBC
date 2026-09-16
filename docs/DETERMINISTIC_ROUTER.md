# Confidence-Scored Deterministic & Agentic Router Specification

## Overview

The core technical differentiator of the Agentic IDE is its **Confidence-Scored Routing Engine**. Rather than relying entirely on LLM inference for every developer action, the platform routes low-risk, pattern-matchable intents to deterministic fast-path engines (LSP, Tree-sitter, ripgrep) while reserving model inference for complex or ambiguous requests.

---

## Routing Decision Matrix

```
                          Incoming Developer Request
                                       │
                                       ▼
                       Intent Classifier & Confidence Engine
                                       │
                      ┌────────────────┴────────────────┐
                      ▼                                 ▼
             Confidence ≥ 80%                  Confidence < 80%
          [Deterministic Fast Path]           [Agentic LLM Escalation]
                      │                                 │
           ┌──────────┴──────────┐            ┌─────────┴─────────┐
           ▼                     ▼            ▼                   ▼
    LSP Refactoring     Tree-sitter AST    LLM Planner        Multi-Agent
      (Rename/Fix)      Structural Search  (BYOK Model)       Subagent Task
           │                     │            │                   │
           └──────────┬──────────┘            └─────────┬─────────┘
                      │                                 │
                      ▼                                 ▼
                 0ms Latency                      ~800ms Latency
               $0.00 Token Cost                  Model Cost Burn
```

---

## Fast-Path Intent Rules vs. LLM Escalation

| Request Intent Category | Confidence Score | Resolution Engine | Execution Latency | Model Cost |
|---|---|---|---|---|
| **Symbol Rename Across Workspace** | $98\%$ | LSP `textDocument/rename` | $< 10\text{ms}$ | $\$0.00$ |
| **Find All Implementations / Callers** | $99\%$ | LSP `textDocument/references` | $< 5\text{ms}$ | $\$0.00$ |
| **Format Code / Fix Lint Violations** | $95\%$ | Prettier / Biome / ESLint | $< 20\text{ms}$ | $\$0.00$ |
| **Run Unit Test File / Suite** | $96\%$ | Test Runner Integration | Local Process | $\$0.00$ |
| **Extract Function / Method** | $85\%$ | Tree-sitter AST Refactor | $< 15\text{ms}$ | $\$0.00$ |
| **Multi-File Feature Implementation** | $30\%$ | **LLM Reasoning Engine** | $\sim 850\text{ms}$ | Standard Token Rate |
| **Bug Diagnosis & Deep Analytical Fix** | $25\%$ | **LLM Reasoning Engine** | $\sim 1200\text{ms}$ | Standard Token Rate |
| **Destructive / High-Risk Refactor** | $70\%$ | **LLM Engine + Guardrail Approval** | $\sim 900\text{ms}$ | Standard Token Rate |

---

## Confidence Score Calculation Heuristic

Given an incoming user query string $Q$ and editor context $C$:

$$\text{Confidence}(Q) = w_1 \cdot S_{\text{pattern}}(Q) + w_2 \cdot S_{\text{LSP}}(C) + w_3 \cdot (1 - S_{\text{ambiguity}}(Q))$$

Where:
- $S_{\text{pattern}}(Q)$: Rule-based keyword & syntax pattern score (e.g., regex matching `rename`, `find callers`, `run tests`).
- $S_{\text{LSP}}(C)$: Availability and precision of active Language Server Protocol capability for target symbols.
- $S_{\text{ambiguity}}(Q)$: Natural language ambiguity score (e.g., presence of terms like `why`, `explain`, `redesign`, `fix bug`).

If $\text{Confidence}(Q) \ge 80\%$, the request is dispatched to the **Deterministic Fast Path**. Otherwise, it escalates to the **LLM Reasoning Engine**.
