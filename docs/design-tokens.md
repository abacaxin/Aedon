# Aedon — tokens e interação do editor

## Fundação

- A interface do editor mantém a paleta monocromática existente em `src/styles.css`: fundo quase preto, superfícies de grafite, texto claro e branco para a ação principal.
- Fonte da interface: Inter; títulos de destaque: Inter Tight. Espaçamento e cantos seguem as classes utilitárias já usadas no projeto.
- Movimento do editor: 160 ms para controles flutuantes e 220 ms para painéis e seções, com `cubic-bezier(0.2, 0.8, 0.2, 1)`. `prefers-reduced-motion` desliga essas entradas.

## Componentes e referência

- Mantemos os componentes React/Tailwind do projeto. O editor usa o padrão de ferramentas de criação: biblioteca à esquerda, canvas central, propriedades à direita.
- Selecionar seção ou elemento revela o painel de propriedades. O painel Elemento oferece posição, largura e escala; o inspetor sobre o canvas dá acesso rápido a cor, largura e movimento.
- Controles flutuantes são marcados com `data-editor-control` para que o clique não seja interpretado como seleção de conteúdo da página.

## Auditoria de interação

- Testar clique em cor, largura e movimento no inspetor, inclusive com modo de arrastar ativo.
- Testar seleção e edição de texto, adição de componente, alternância entre telas e exportação.
- Conferir foco por teclado e redução de movimento.
