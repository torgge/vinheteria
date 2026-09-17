# Diagramas — Convenções

Este diretório guarda os diagramas fonte em **draw.io** (`.drawio`) e seus SVGs exportados, usados pelos docs em `docs/*.md` quando o diagrama é grande/denso demais para Mermaid inline ou ASCII art.

## Quando usar cada formato

| Formato | Quando usar | Onde vive |
|---|---|---|
| **Mermaid** (inline) | Sequence diagrams, flowcharts, C4 Level 1/2 — precisa renderizar direto no GitHub/PR sem build step | Bloco ` ```mermaid ` dentro do próprio `.md` |
| **ASCII art** (inline) | Diagramas de caixas simples já existentes em docs legados (`02-arquitetura.md`, `10-cicd-github-actions.md`, `11-aws-cloud-terraform.md`) | Bloco de código dentro do próprio `.md` |
| **draw.io** (`.drawio` + `.svg`) | Diagramas complexos com layout preciso: arquitetura AWS completa, C4 Level 3/4, topologia de rede, ER diagrams grandes | `docs/diagrams/*.drawio` (fonte) + `docs/diagrams/*.svg` (exportado, referenciado via `<img>`/markdown no `.md`) |

Diagramas simples continuam em Mermaid inline — zero dependência externa, diff legível, renderiza nativo no GitHub. draw.io é reservado para os casos em que o layout manual compensa (diagramas grandes onde o auto-layout do Mermaid fica ilegível).

## Workflow

1. Instale a extensão recomendada do VS Code (`.vscode/extensions.json` → `hediet.vscode-drawio`) — edita `.drawio` com preview ao vivo, sem precisar do app desktop ou de conta em app.diagrams.net.
2. Crie/edite o diagrama e salve o fonte em `docs/diagrams/<nome>.drawio`.
3. Exporte como SVG (na extensão: clique direito no canvas → **Export as** → **SVG...**) para `docs/diagrams/<nome>.svg`.
4. Referencie no documento: `![Descrição](./diagrams/<nome>.svg)`.
5. Faça commit dos dois arquivos juntos — o `.drawio` mantém o diagrama editável; o `.svg` garante renderização no GitHub sem plugin.

## Nomenclatura

`docs/diagrams/{contexto}-{tipo}.drawio`, por exemplo:
- `aws-architecture.drawio`
- `sales-c4-level2.drawio`
- `fulfillment-saga-sequence.drawio`
