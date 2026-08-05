# Agentic AI IDE — Code-OSS Fork & Distribution

The **Agentic AI IDE** is a telemetry-free **Code-OSS (VS Code core)** distribution featuring a **Confidence-Scored Dual-Path Router**, **Shadow Workspace Verification Engine**, **Rust Codebase Indexing Sidecar**, and a dedicated **Agentic DBMS Studio & Table Data Grid Editor**.

---

## ⚡ Key Highlights

- **Zero Telemetry:** Completely stripped of Microsoft telemetry hooks (`enableTelemetry: false`).
- **OpenVSX Extension Marketplace:** Integrated with [OpenVSX](https://open-vsx.org) for zero-tracking extension downloads.
- **Dedicated Agentic DBMS Studio:** Real SQL execution engine, visual `EXPLAIN ANALYZE` node trees, schema migration diffing, interactive table data grid editing, and multi-format data exporter (Excel `.xlsx`, CSV, JSON, Markdown).
- **Dual-Path Confidence Router:** Fast-path deterministic resolution in $\sim 3\text{ms}$ with $\$0.00$ model token cost.

---

## 🚀 Building from Source

```bash
# Validate product config & telemetry removal
npm run prepare:fork

# Apply branding assets
npm run apply:branding

# Execute distribution build
npm run build:code-oss
```
