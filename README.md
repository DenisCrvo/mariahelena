# Convite digital — Maria Helena

Convite responsivo de aniversário, feito com HTML, CSS e JavaScript sem processo de build. O site pode ser servido diretamente pelo GitHub Pages. O horário da festa não foi informado; por isso, a contagem mostra somente dias, calculados no fuso `America/Recife`.

## Arquivos

- `index.html`: conteúdo e estrutura semântica do convite.
- `css/style.css`: identidade visual responsiva, estados de foco e animações.
- `js/script.js`: contagem de dias, animações de entrada, validação e envio ao serviço.
- `integrations/google-apps-script.gs`: endpoint Apps Script que valida e registra confirmações.

## Configurar confirmações reais

O formulário permanece desabilitado até que `appsScriptUrl` seja preenchida no objeto `EVENT_CONFIG` em `js/script.js`. Não publique a URL no código enquanto não tiver implantado o serviço e testado o fluxo.

### Criar e publicar o Apps Script

1. Crie uma planilha Google para as confirmações. Copie o ID entre `/d/` e `/edit` na URL da planilha.
2. Na planilha, abra **Extensões → Apps Script**. Substitua o conteúdo do editor pelo código de `integrations/google-apps-script.gs`.
3. Substitua `COLE_AQUI_O_ID_DA_PLANILHA` pelo ID da planilha. Se o limite de convidados mudar, altere `MAX_ATTENDEES` no script e `maxAttendees` no objeto `EVENT_CONFIG` do site para o mesmo valor.
4. Salve o projeto. No Apps Script, selecione **Implantar → Nova implantação**, tipo **Aplicativo da web**.
5. Escolha **Executar como: Eu**. Para um convite público, selecione **Quem tem acesso: Qualquer pessoa** (a opção pode variar conforme a política da conta Google) e autorize o acesso à planilha. O aplicativo necessita aceitar envios de visitantes sem login. Não conceda acesso de editor à planilha aos convidados.
6. Implante e copie a URL terminada em `/exec` exibida pela implantação. Uma implantação de teste `/dev` não é adequada ao site público.
7. Cole a URL no campo `appsScriptUrl` em `js/script.js`, mantendo a URL entre aspas. Se alterar o código do Apps Script depois da implantação, atualize a implantação existente para uma nova versão e mantenha a URL `/exec`.
8. Publique o site por HTTPS. Envie uma confirmação de teste pela página publicada e confira se nome, quantidade e data/hora aparecem como uma nova linha na aba `Confirmacoes`. Verifique também nome vazio e quantidade fora do intervalo, que devem ser rejeitados. Remova manualmente a linha de teste da planilha.

### Como funciona e limites

O navegador envia o formulário para um iframe e recebe uma resposta assinada logicamente por um nonce aleatório daquela solicitação, evitando depender de permissões CORS ou apresentar sucesso apenas por ter iniciado o envio. Um estado de carregamento, timeout, erro de comunicação e erro retornado pelo serviço são tratados na página.

O endpoint é público porque não há autenticação de convidados. Validação de nome e quantidade acontece no navegador e novamente no Apps Script; chamadas automatizadas ainda podem abusar do endpoint, gravar respostas falsas ou aumentar uso/cotas do Google. A URL publicada não é um segredo. Para uso público, acompanhe a planilha e as cotas; se for necessário limitar abuso ou autenticar convidados, será preciso acrescentar uma solução apropriada no servidor. O script neutraliza nomes iniciados por caracteres de fórmula antes de gravar na planilha. As respostas são acessíveis na própria planilha pelos responsáveis que têm acesso a ela.

O Apps Script e o acesso à conta/planilha não podem ser configurados nem testados neste workspace. Até a implantação e a configuração da URL no projeto, o formulário informa explicitamente que o registro não está habilitado e não apresenta confirmações fictícias.

## Testes locais

Abra `index.html` em um navegador ou sirva a pasta como conteúdo estático local. Não é necessário Node.js. Sem a URL configurada, envie o formulário para confirmar que a página comunica a pendência em vez de simular o recebimento. Depois de configurar, faça um envio real e confira a aba da planilha.

Confira também em 360, 390, 768, 1024 e 1440 px, teste teclado e preferência de movimento reduzido, e valide o endereço no link **Como chegar**.

### Verificações realizadas neste workspace

- A página foi aberta no navegador integrado pelo caminho local; título, seções, formulário, contagem e ilustração carregaram.
- A largura do documento foi verificada em 360, 390, 768, 1024 e 1440 px, sem rolagem horizontal.
- Foram testadas as validações para nome vazio e quantidades 0, -1 e acima do máximo (9); os erros esperados foram apresentados.
- O envio com dados válidos, mas sem URL de serviço configurada, apresentou a mensagem de pendência e não declarou sucesso nem apagou os dados.
- A preferência `prefers-reduced-motion` foi ativada no navegador; as animações foram reduzidas, as seções reveladas permaneceram visíveis e o primeiro foco por teclado alcançou o link para pular ao conteúdo.
- A checagem local não encontrou IDs duplicados nem referências locais ausentes; a página foi interpretada e exibida no navegador integrado. Os diagnósticos do editor não apontaram erros em HTML, CSS ou JavaScript.
- O endereço e a query do link do Google Maps foram conferidos, mas o destino externo não foi aberto.

O envio bem-sucedido, falha de conexão, resposta do Apps Script, repetição durante uma requisição e gravação real na planilha não foram testados: a URL do Apps Script e a planilha ainda não foram configuradas. Execute esses testes depois da implantação descrita acima.

## Publicar no GitHub Pages

1. Crie um repositório GitHub e envie os arquivos deste diretório para a branch escolhida (por exemplo, `main`). Nenhum commit ou publicação foi feito por este projeto.
2. No repositório, abra **Settings → Pages**.
3. Em **Build and deployment**, escolha **Deploy from a branch**, selecione a branch e a pasta `/ (root)` e salve.
4. Aguarde a publicação e abra a URL apresentada pelo GitHub Pages. Para repositórios de projeto, a URL geralmente contém `/nome-do-repositorio/`; os caminhos relativos deste convite dão suporte a esse formato.
5. Configure e teste o Apps Script conforme a seção anterior. O endereço do site deve usar HTTPS.

Não foi informado um horário para a festa. Caso seja confirmado e se deseje uma contagem regressiva com horas, configure o instante ISO com deslocamento de Recife no campo `officialTime` de `EVENT_CONFIG` e ajuste a apresentação; enquanto permanecer `null`, a página mostra apenas a contagem de dias.
