# Decisões — Aedon

## Interação contextual do editor

- Data: 2026-09-26.
- Estado: solicitada pelo usuário, implementada e validada localmente.
- Fonte: pedido atual do usuário e imagem de referência do Canva.
- Decisão: seleção de cada elemento exibe contorno, alças e ações no próprio canvas; arrastar o selecionado move diretamente, sem alternar um modo global. O painel lateral permanece opcional para ajustes finos.
- Justificativa: o fluxo anterior exigia procurar um controle distante do objeto e confundia edição de elemento com edição de seção.
- Impacto: `Canvas.tsx`, `ElementSelection.tsx`, `PropertiesPanel.tsx`, `EditorShell.tsx`, `layout.ts` e documentação de tokens.
- Aprovação adicional: não necessária para a implementação local solicitada; publicação não autorizada por este registro.
