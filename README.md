# Locação de veículos

Projeto acadêmico de Programação com Frameworks Web: uma API REST com MySQL e uma interface React para cadastrar usuários e veículos, autenticar usuários, iniciar locações e registrar devoluções, preservando o histórico de cada usuário.

## Identificação

Preencher antes da entrega. O enunciado permite trabalho individual ou grupos de até quatro alunos.

| Campo | Preencher |
|---|---|
| Integrante 1 — nome completo e matrícula | |
| Integrante 2 — nome completo e matrícula, se houver | |
| Integrante 3 — nome completo e matrícula, se houver | |
| Integrante 4 — nome completo e matrícula, se houver | |
| Turma / instituição | |
| Professor / data de apresentação | |

## Funcionalidades e organização

- Cadastro, login com JWT e logout na interface.
- Cadastro de veículos, listagem e filtro de disponibilidade.
- Registro de locação pelo usuário autenticado, com período e cálculo no backend.
- Histórico próprio com dados do veículo, valor e status.
- Devolução pelo proprietário, com liberação do veículo.
- Validações, mensagens de erro e proteção contra locações simultâneas do mesmo veículo.

Não há pagamento, multa, reserva futura, perfil administrativo, edição ou exclusão de veículos e locações. Todos os usuários autenticados podem cadastrar veículos, conforme o escopo do enunciado.

```text
backend/
  prisma/              schema, migrations e seed
  src/
    routes.ts          endpoints e aplicação da autenticação
    controllers/       entrada e resposta HTTP
    services/          validações e regras de negócio
    middleware/        validação do JWT
    lib/               configuração, banco, cálculo e erros
  tests/               testes automatizados
frontend/
  src/                 componentes, estados, formulários e cliente da API
docs/                  diagramas, guias de estudo e entrega
```

Backend: Node.js, Express 5, TypeScript, Prisma ORM 6, MySQL 8, bcrypt e jsonwebtoken. Frontend: React, TypeScript e Vite. As versões exatas estão nos `package.json` e no `package-lock.json`; use o lock para reproduzir a instalação.

## Pré-requisitos

- Node.js 22.12 ou superior; recomendado Node.js 24 LTS, com npm.
- MySQL 8 disponível localmente ou em servidor acessível.
- Git para clonar o repositório.
- Docker com Compose é uma opção para o banco, não um requisito.

## Instalação e variáveis

```bash
git clone https://github.com/brunodutras/locacao-de-veiculos.git
cd locacao-de-veiculos
npm ci
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Edite `backend/.env` com a URL do banco e um `JWT_SECRET` próprio, longo e aleatório. Não envie `.env`, credenciais ou tokens ao Git. `DATABASE_URL` segue o formato `mysql://USUARIO:SENHA@HOST:3306/locacao`; caracteres especiais nas credenciais precisam ser codificados para URL. Configure `PORT` e `CORS_ORIGIN` de acordo com sua execução. No frontend, `VITE_API_URL` aponta para o backend, normalmente `http://localhost:3000`. Variáveis `VITE_` são públicas e nunca devem conter segredos.

### Banco com Docker Compose

Na raiz do projeto:

```bash
docker compose up -d mysql
```

Aguarde o banco ficar saudável (`docker compose ps`). Use as credenciais fictícias do Compose e de `.env.example` apenas no ambiente de estudo. O volume mantém os dados entre reinicializações. Se a porta 3306 já estiver ocupada, use seu MySQL existente ou ajuste o mapeamento e `DATABASE_URL`.

### Banco sem Docker

Com uma conta autorizada no MySQL, crie um banco vazio e um usuário próprio:

```sql
CREATE DATABASE locacao CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'locacao'@'localhost' IDENTIFIED BY 'SUBSTITUA_POR_SENHA_LOCAL';
GRANT ALL PRIVILEGES ON locacao.* TO 'locacao'@'localhost';
```

Para também executar a suíte de integração, crie o banco dedicado e conceda acesso ao mesmo usuário:

```sql
CREATE DATABASE locacao_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
GRANT ALL PRIVILEGES ON locacao_test.* TO 'locacao'@'localhost';
```

Configure a URL correspondente em `backend/.env`. O usuário precisa de permissões para as migrations. Não use o usuário root na aplicação.

### Migrations e dados fictícios

```bash
npm run db:generate -w backend
npm run db:migrate -w backend
npm run db:seed -w backend
```

`db:migrate` aplica as migrations versionadas com `prisma migrate deploy`. O seed é reproduzível: cria usuários e veículos fictícios sem apagar o histórico existente. Rode-o uma vez para preparar a demonstração; ele não substitui as migrations.

| E-mail fictício | Senha de demonstração |
|---|---|
| ana@example.com | Estudo@12345 |
| bruno@example.com | Estudo@12345 |

A frota fictícia inicial é:

| Veículo | Placa | Diária |
|---|---|---|
| Fiat Argo 2024 | ABC1D23 | R$ 129,90 |
| Chevrolet Onix 2025 | DEF4G56 | R$ 149,90 |
| Toyota Corolla 2025 | HIJ7K89 | R$ 229,90 |

Os veículos de exemplo são definidos em `backend/prisma/seed.ts`. Se já estiverem alugados, finalize a locação com o proprietário ou cadastre outro veículo. Não apague o histórico para preparar uma apresentação.

## Executar

Em dois terminais, na raiz:

```bash
npm run dev -w backend
```

```bash
npm run dev -w frontend
```

Abra o endereço exibido pelo Vite, normalmente `http://localhost:5173`. O backend usa normalmente `http://localhost:3000`. Se o Vite selecionar outra porta, ajuste `CORS_ORIGIN` e reinicie o backend. Para compilar:

```bash
npm run typecheck
npm run lint
npm run build
```

## Verificação e testes

```bash
npm test
npm run test:integration -w backend
```

Os testes de integração usam **MySQL real** e exigem `TEST_DATABASE_URL` apontando para um banco dedicado cujo nome termina em `_test`. Não use o banco da aplicação: a suíte prepara e limpa seus próprios dados. Crie o banco `locacao_test`, dê ao usuário permissões nele e configure a variável antes de executar. O Compose prepara os bancos de estudo e teste.

A suíte cobre autenticação, duplicidades, entradas inválidas, cálculo, propriedade, devolução, rollback e concorrência. O caso concorrente envia duas solicitações para o mesmo veículo e verifica que apenas uma locação ativa persiste. Consulte [a verificação realizada](docs/verificacao.md) para distinguir testes executados de verificações ainda pendentes. Um build aprovado não comprova a integração com o banco.

## API

Todas as respostas de erro usam uma mensagem legível no campo `mensagem`. Erros de entrada retornam 400; autenticação inválida retorna 401; recursos não encontrados retornam 404; duplicidades e conflitos retornam 409. A API não retorna a senha nem seu hash. As rotas protegidas recebem `Authorization: Bearer <token>`.

| Método | Rota | Acesso | Uso |
|---|---|---|---|
| POST | `/usuarios` | Público | Cadastro com nome, e-mail e senha |
| POST | `/login` | Público | Credenciais; retorna token e usuário |
| POST | `/veiculos` | JWT | Cadastrar veículo |
| GET | `/veiculos` | JWT | Listar todos |
| GET | `/veiculos?disponivel=true` | JWT | Listar disponíveis |
| POST | `/locacoes` | JWT | Iniciar locação |
| GET | `/locacoes` | JWT | Histórico do usuário autenticado |
| PATCH | `/locacoes/:id/devolucao` | JWT | Finalizar locação própria |

Exemplos em terminal, com o backend iniciado:

```bash
curl -i http://localhost:3000/usuarios \
  -H 'Content-Type: application/json' \
  -d '{"nome":"Pessoa de teste","email":"pessoa@example.com","senha":"Estudo@12345"}'

curl -s http://localhost:3000/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"ana@example.com","senha":"Estudo@12345"}'
```

Copie somente o campo `token` da resposta para a variável local abaixo. Não salve tokens no repositório.

```bash
TOKEN='COLE_O_TOKEN_RETORNADO'

curl -s 'http://localhost:3000/veiculos?disponivel=true' \
  -H "Authorization: Bearer $TOKEN"

curl -i http://localhost:3000/veiculos \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"marca":"Fiat","modelo":"Argo","placa":"LMN2P34","ano":2025,"valorDiaria":"150.00"}'

curl -i http://localhost:3000/locacoes \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"veiculoId":1,"dataInicio":"2026-11-01T09:00:00-03:00","dataPrevistaDevolucao":"2026-11-02T10:00:00-03:00"}'

curl -s http://localhost:3000/locacoes \
  -H "Authorization: Bearer $TOKEN"

curl -i -X PATCH http://localhost:3000/locacoes/1/devolucao \
  -H "Authorization: Bearer $TOKEN"
```

Substitua os IDs pelos retornados na sua execução e as datas pelo período que deseja demonstrar. Repetir o cadastro da mesma placa produz conflito; repetir a devolução também. Um JWT expira em uma hora; faça login novamente quando receber 401.

## Regras e decisões

A migration inclui chaves estrangeiras e restrições `CHECK` para diária e total positivos, período válido e coerência entre status e devolução. Essas restrições SQL complementam as validações do Service; não são representadas como campos adicionais no schema Prisma. Use MySQL 8.0.16 ou superior para aplicação de `CHECK` (recomendado 8.4).

**Dinheiro.** A diária e o total são decimais no banco e são calculados com `Prisma.Decimal` no backend. A API os serializa como strings para preservar precisão. O total contratado é `ceil((fim - início) / 86.400.000) × diária`: 24 horas custam uma diária; 25 e 48 horas custam duas. A devolução não recalcula o contrato e não gera multa.

**Datas.** A API recebe instantes ISO 8601 com `Z` ou deslocamento explícito, como `-03:00`, e exige fim posterior ao início. A duração usa milissegundos decorridos, não dias do calendário. O frontend converte o horário local escolhido em ISO; as respostas são UTC. O MySQL guarda os instantes normalizados em UTC. A interface exibe as datas no fuso do navegador. A data efetiva de devolução vem do relógio do backend.

**Identidade.** O JWT assinado contém o ID em `sub`, expiração e dados técnicos; não contém senha ou hash. O middleware valida a assinatura e a expiração antes das rotas de veículos e locações. O ID usado pelos Services vem desse token. O cliente não escolhe um `usuarioId` para consultar ou criar uma locação. O histórico é filtrado pelo proprietário e a devolução exige o mesmo proprietário.

**Concorrência.** Dentro de uma transação, `registrarLocacao` tenta atualizar o veículo somente se `disponivel = true` e exige exatamente uma linha atualizada. Essa escrita condicional é o ponto de disputa entre requisições; uma consulta anterior sozinha não garante exclusividade. A criação da locação e a mudança de disponibilidade são confirmadas juntas ou desfeitas juntas. A finalização também reivindica condicionalmente uma locação ativa do proprietário e libera o veículo na mesma transação, impedindo devoluções duplicadas.

**Autenticação.** O hash bcrypt usa custo 12. Login compara a senha com o hash e gera um JWT com validade de uma hora. O frontend conserva a sessão por aba e limpa a autenticação ao expirar ou receber 401; logout remove a sessão local. Não há revogação de JWT no servidor neste escopo acadêmico.

## Apresentação, estudo e entrega

Comece pelo [roteiro de apresentação](docs/roteiro-apresentacao.md), que inclui demonstração das rotas e perguntas para treinar. Siga o percurso:

1. `backend/prisma/schema.prisma`: entidades, decimais, chaves e relações.
2. `backend/src/routes.ts` e `middleware/auth.ts`: acesso e autenticação.
3. Controllers e Services: registro e finalização da locação.
4. `backend/src/lib/calculo.ts`: duração e valores.
5. Componentes React e cliente HTTP: estado, eventos, JWT e atualização.
6. Testes: conflitos, rollback e propriedade.

Os [diagramas](docs/diagramas.md) são referências de estudo. Cada aluno deve elaborar individualmente os dois diagramas e as cinco respostas **à mão, em papel A4 branco sem pautas ou quadriculados**, identificando nome completo. Não substitua essa entrega por impressão dos arquivos digitais.

- [Checklist de requisitos e referências](docs/requisitos.md)
- [Guia das cinco questões individuais](docs/guia-estudo.md)
- [Checklist de entrega individual](docs/checklist-entrega.md)
- [Resultados e limitações da verificação](docs/verificacao.md)

A “carta” mencionada no checklist corresponde à entrega manuscrita individual já prevista no enunciado: um DER, um diagrama de sequência e as respostas às cinco questões. Não há documento extra a confirmar.

## Git e revisão

O destino é o repositório existente `https://github.com/brunodutras/locacao-de-veiculos.git`. Confira antes do envio:

```bash
git remote -v
git status --short
git diff --check
git diff
```

Revise arquivos ignorados e confirme que `.env` e tokens não estão no commit. Depois de preencher a identificação, executar os testes e revisar os arquivos, crie commits locais e envie ao repositório somente quando decidir fazê-lo. Não é necessário criar outro repositório nem sobrescrever histórico remoto. A situação concreta dos commits e testes está em `docs/verificacao.md`.

## Materiais e fontes

O enunciado `Projeto_Locacao_de_Veiculos.pdf` orientou o escopo. O `first-project.zip` foi inspecionado: é um exercício introdutório de componentes e props React, não o sistema de locação. As apostilas são apoio; os nomes, regras e fluxos deste projeto devem ser estudados diretamente na implementação.

Referências oficiais: [Express 5](https://expressjs.com/en/guide/migrating-5/), [transações Prisma 6](https://www.prisma.io/docs/orm/v6/prisma-client/queries/transactions), [conector MySQL Prisma 6](https://docs.prisma.io/docs/orm/v6/overview/databases/mysql), [Vite](https://vite.dev/guide/) e [React: estado e eventos](https://react.dev/learn/adding-interactivity).
