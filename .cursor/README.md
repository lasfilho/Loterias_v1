# Configuração Cursor — MCP

## Setup rápido (≈ 5 min)

1. **Node.js 18+** instalado (`node -v`, `npx -v`)
2. **PostgreSQL local** rodando:
   ```bash
   docker compose up -d
   ```
3. Copie a config MCP (se ainda não existir):
   ```bash
   cp .cursor/mcp.json.example .cursor/mcp.json
   ```
4. No Cursor: **Settings → Tools & MCP** → ativar servidor `postgres`
5. Reinicie o Cursor se as tools não aparecerem

## Arquivos

| Arquivo | Commitar? | Uso |
|---------|-----------|-----|
| `mcp.json` | Sim (só URL dev local) | Config ativa do workspace |
| `mcp.json.example` | Sim | Template postgres + playwright |
| `mcp.playwright.json.example` | Sim | Opcional: QA de dashboards |
| `mcp.github.json.example` | Sim | Copiar para `~/.cursor/mcp.json` (global) |
| `mcp.local.json` | **Não** (gitignore) | Overrides pessoais com secrets |

## Mesclar configs opcionais

Edite `.cursor/mcp.json` e copie o bloco `playwright` de `mcp.json.example` quando precisar testar UI no browser.

GitHub: use **global** (`%USERPROFILE%\.cursor\mcp.json` no Windows), nunca commite token.

## Documentação completa

[`docs/mcp/overview.md`](../docs/mcp/overview.md)
