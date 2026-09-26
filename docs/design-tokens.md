# Aedon — tokens e interação do editor

## Fundação

- A interface do editor mantém a paleta monocromática existente em `src/styles.css`: fundo quase preto, superfícies de grafite, texto claro e branco para a ação principal.
- Fonte da interface: Inter; títulos de destaque: Inter Tight. Espaçamento e cantos seguem as classes utilitárias já usadas no projeto.
- Movimento do editor: 160 ms para controles flutuantes e 220 ms para painéis e seções, com `cubic-bezier(0.2, 0.8, 0.2, 1)`. `prefers-reduced-motion` desliga essas entradas.

## Componentes e referência

- Mantemos os componentes React/Tailwind do projeto. O editor usa o padrão de ferramentas de criação: biblioteca à esquerda, canvas central, propriedades à direita.
- Selecionar um elemento revela contorno, alças de dimensão e barra de ações presa ao próprio objeto, inspirados no comportamento contextual mostrado pelo usuário no Canva. Arrastar o elemento selecionado move sem ativar um modo global. O painel Elemento é opcional e oferece ajustes numéricos precisos.
- Arraste e redimensionamento são agrupados em um único passo de desfazer; clique duplo em texto entra em edição direta sem deslocar o canvas nem abrir automaticamente o painel lateral.
- O caminho principal é biblioteca → adicionar seção → seleção e rolagem automáticas → editar conteúdo → ajustar aparência. Biblioteca e propriedades se alternam para manter o canvas legível.
- O canvas oferece zoom com botões de incremento e “Ajustar”; quando ampliado além da largura disponível, permite rolagem horizontal visível. O deslocamento de elementos é calculado no sistema de coordenadas do iframe.
- A barra de seção expõe “Elemento” e “Ações”; não há botão de “modo mover”. Os cartões da biblioteca mantêm o botão explícito “Adicionar” acessível por teclado, além do gesto de arrastar.
- Imagens são selecionadas pela moldura, incluindo camadas decorativas não interativas. A barra mostra “Trocar imagem”; textos mostram “Editar” e cor individual. Redimensionar a moldura altera largura e altura sem modificar os demais elementos.
- No painel de seção, o conteúdo vem antes da aparência. Campos de edição usam altura mínima de 40 px e controles importantes têm estados de foco visíveis.
- Controles flutuantes são marcados com `data-editor-control` para que o clique não seja interpretado como seleção de conteúdo da página.

## Auditoria de interação

- Testar seleção, arraste, alças, cor individual, edição de texto e troca de imagem na barra contextual.
- Testar seleção e edição de texto, adição de componente, alternância entre telas e exportação.
- Conferir foco por teclado e redução de movimento.
