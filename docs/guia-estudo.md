# Guia de estudo — cinco questões individuais

Use este guia para localizar o código e construir suas próprias explicações. Não copie estas orientações como resposta final. Cada aluno deve responder A–E individualmente à mão, em papel A4 branco sem pautas ou quadriculados, e conseguir defender oralmente qualquer trecho.

## A. Route, Controller e Service no registro

Abra `backend/src/routes.ts`: a rota `POST /locacoes` recebe a autenticação e encaminha o pedido ao Controller. Abra `backend/src/controllers/locacao.controller.ts`: o Controller usa o corpo da requisição e `res.locals.usuarioId`, chama o Service e monta a resposta HTTP 201. Ele não calcula diárias nem altera diretamente o banco.

Abra `backend/src/services/locacao.service.ts`, função `registrarLocacao`: ela valida a entrada, exige fim posterior ao início, consulta o veículo e calcula o total. Dentro de `$transaction`, reivindica sua disponibilidade e cria a locação com os dados relacionados. O Prisma executa as operações no MySQL.

Treine responder:

- Onde se decide qual endpoint executar? Onde se escolhe o status HTTP?
- Por que a regra “veículo indisponível” fica no Service?
- De onde vem `usuarioId` e por que não pode vir livremente do formulário?
- O que acontece se `locacao.create` falhar depois de alterar o veículo?

## B. Relações 1:N e consulta dos dados relacionados

Abra `backend/prisma/schema.prisma`. `Usuario.locacoes` e `Veiculo.locacoes` são listas. Em `Locacao`, `usuarioId` e `veiculoId` são chaves estrangeiras obrigatórias, ligadas aos respectivos `id` por `@relation`. Não há `@unique` nessas chaves estrangeiras: o mesmo usuário ou veículo pode aparecer várias vezes no histórico. Já `Usuario.email` e `Veiculo.placa` têm `@unique`.

Em `listarLocacoes`, o filtro `where: { usuarioId }` limita os resultados ao dono. `include: { veiculo: true }` acrescenta marca, modelo, placa, diária e disponibilidade do veículo à resposta. A lista contém locações ativas e finalizadas porque não há filtro exclusivo por status.

Treine responder:

- Por que `veiculoId @unique` impediria o histórico desejado?
- Qual lado guarda cada FK? Um veículo sem locações pode existir?
- Qual a diferença entre um índice e uma restrição de unicidade?
- O que a interface perderia se o `include` fosse removido?
- Por que `onDelete: Restrict` ajuda a preservar o histórico?

## C. Login, JWT, bcrypt e senha

Abra `backend/src/services/auth.service.ts`. `cadastrarUsuario` valida a entrada e aplica `bcrypt.hash(senha, 12)` antes do `create`. O `select` definido por `usuarioPublico` retorna apenas ID, nome, e-mail e data de cadastro. O hash não volta ao cliente.

A função `login` busca o usuário por e-mail e compara a senha recebida usando `bcrypt.compare`. Credenciais incorretas produzem uma mensagem genérica. Se estiverem corretas, `jwt.sign` cria um token HS256 com o ID em `sub`, validade de uma hora, emissor `locacao-api` e audiência `locacao-web`. O token não carrega senha nem hash. JWT assinado pode ser lido pelo cliente; assinatura não é criptografia do conteúdo.

Abra `backend/src/middleware/auth.ts`. `autenticar` exige o cabeçalho Bearer, valida assinatura, algoritmo, emissor, audiência e expiração, interpreta o `sub` e confirma a existência do usuário. Só então define `res.locals.usuarioId` e chama `next()`. Um token inválido ou expirado retorna 401.

Treine responder:

- Por que comparar hash é diferente de descriptografar senha?
- Qual a função do salt e do custo do bcrypt?
- O que alguém consegue ler em um JWT? O que não consegue alterar sem invalidá-lo?
- Por que retirar o token do navegador não o revoga no servidor?
- Onde a API impede acesso sem token, mesmo que alguém contorne a interface?

## D. Duas solicitações simultâneas

Abra `registrarLocacao` em `backend/src/services/locacao.service.ts`. A consulta `findUnique` verifica existência e obtém a diária. Ela não é a garantia contra corrida. A garantia é `updateMany` com os dois critérios `id` e `disponivel: true`, mudando para `false`, dentro da mesma transação que cria a locação.

A função exige `alterados.count === 1`. Se duas requisições disputarem o mesmo veículo, somente a atualização que encontrar o estado disponível consegue reivindicá-lo. A outra recebe conflito. Se a criação da locação falhar, a transação desfaz a mudança de disponibilidade. Não existe intervalo confirmado em que apenas metade da operação tenha sido persistida.

Em `finalizarLocacao`, a atualização exige ID, proprietário, status `ATIVA` e devolução nula. Somente uma finalização muda essa linha; depois o veículo é liberado na mesma transação. Repetir a operação não gera outra devolução nem altera o histórico.

Abra `backend/tests/api.test.ts` para estudar o teste com duas solicitações concorrentes e a consulta final ao banco. O teste precisa de MySQL real; simular o resultado de `updateMany` não demonstraria a disputa no banco.

Treine responder:

- Por que “consultar disponível, depois inserir” permite uma corrida?
- Qual instrução é o ponto de disputa? O que o valor `count` prova?
- Por que a atualização e o `create` precisam da mesma transação?
- Como distinguir indisponibilidade esperada de erro inesperado do banco?
- Por que `status` e `dataDevolucao` aparecem juntos na condição da finalização?

## E. Estado, eventos e atualização React

Abra `frontend/src/components/RentalForm.tsx`. `inicio`, `fim` e `erro` são estados criados com `useState`. O veículo escolhido chega pela prop `selecionado`; `onSelect` atualiza o estado correspondente em `App`. Campos controlados recebem `value` e atualizam os estados em `onChange`.

A função `enviar` trata `onSubmit`, chama `preventDefault`, faz a validação imediata das datas e converte o horário local para ISO com `toISOString()`. Depois chama `onSave` com `veiculoId`, início e fim. Não envia usuário nem calcula um valor definitivo. Quando `onSave` retorna sucesso, limpa datas e seleção; se falhar, preserva os campos para correção.

Abra `frontend/src/App.tsx`. O callback `onSave` chama `executar`. Essa função ativa `ocupado`, faz a chamada à API, apresenta sucesso e chama `carregar` para consultar a frota e o histórico novamente. `carregar` usa `Promise.all` para buscar `/veiculos` e `/locacoes`; os novos estados provocam a atualização visual. O formulário e os botões usam `busy` para evitar envio repetido enquanto aguardam. `atualizar` permite tentar novamente a consulta após um erro. A referência `sessaoAtual` descarta resultados de uma sessão antiga após logout ou troca de usuário; `carregar` também limpa a seleção quando o veículo deixa de estar disponível.

Abra `frontend/src/api.ts`. `solicitar` usa `fetch`, adiciona JSON quando há corpo e Bearer quando há token. Respostas sem sucesso geram `ApiError`. Em `App`, `tratarErro` limpa a sessão se receber 401; `sair` remove `rota-sessao` de `sessionStorage`. Há também um temporizador baseado na expiração do JWT para encerrar a sessão visualmente. A autorização definitiva permanece no backend.

`AuthForm` gerencia cadastro/login; `VehicleForm`, cadastro da frota; `RentalHistory`, histórico e pedido de devolução. Em `App`, o filtro `filtro` escolhe quais veículos já carregados são exibidos. A API também oferece seu filtro próprio `?disponivel=true` para consultas diretas.

Treine responder:

- Qual diferença existe entre mudar uma variável comum e chamar `setInicio`?
- Como um erro de API chega ao usuário? O que acontece com o formulário?
- Por que recarregar os dados depois de uma locação e de uma devolução?
- Por que a validação de datas também existe no backend?
- Por que converter `datetime-local` para ISO com fuso evita ambiguidade no transporte?
- Qual arquivo demonstra que os dados vêm da API real e não de uma lista fixa?
