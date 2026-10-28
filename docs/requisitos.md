# Checklist de requisitos e localização

Este checklist descreve a implementação; os resultados de execução ficam em [verificacao.md](verificacao.md). Não confundir código presente com teste executado.

| Requisito | Onde localizar | O que conferir |
|---|---|---|
| Node, Express e TypeScript | `backend/package.json`, `src/app.ts` | Dependências, configuração e montagem da API |
| MySQL e Prisma | `backend/prisma/schema.prisma` | `provider = "mysql"`, modelos e tipos |
| Migrations versionadas | `backend/prisma/migrations/` | Tabelas, índices, chaves e restrições |
| Usuario 1:N Locacao | `schema.prisma`, `Usuario.locacoes`, `Locacao.usuario` | `usuarioId` não único |
| Veiculo 1:N Locacao | `schema.prisma`, `Veiculo.locacoes`, `Locacao.veiculo` | `veiculoId` não único |
| Cadastro e login | `services/auth.service.ts`, `controllers/auth.controller.ts` | Nome/e-mail/senha, bcrypt e JWT |
| E-mail único / placa única | `schema.prisma`, `lib/errors.ts` | Restrições no banco e mensagem de conflito |
| Hash e proteção de senha | `auth.service.ts` | bcrypt custo 12 e seleção de dados públicos |
| JWT com expiração | `auth.service.ts`, `middleware/auth.ts` | Assinatura, expiração, emissor, audiência e `sub` |
| Rotas de veículos e locações protegidas | `backend/src/routes.ts` | Middleware antes dos endpoints protegidos |
| Identidade pelo token | `middleware/auth.ts`, Controllers | `res.locals.usuarioId` usado pelos Services |
| Cadastro de veículos / diária positiva | `veiculo.service.ts`, `lib/validation.ts` | Validação e disponibilidade inicial |
| Listagem / filtro disponíveis | `veiculo.service.ts`, `GET /veiculos` | Parâmetro `disponivel` validado |
| Registro e validação das datas | `locacao.service.ts`, `lib/validation.ts` | Fim posterior ao início, ISO com fuso |
| Cálculo de diária fracionada | `lib/calculo.ts`, `tests/calculo.test.ts` | `Math.ceil`, Decimal e limite monetário |
| Disponibilidade e concorrência | `registrarLocacao`, `tests/api.test.ts` | `updateMany` condicional dentro de `$transaction` |
| Rollback integral | `registrarLocacao`, `tests/api.test.ts` | Falha não deixa mudança parcial |
| Histórico próprio | `listarLocacoes` | `where: { usuarioId }`, inclui finalizadas |
| Consulta com relação | `listarLocacoes`, `registrarLocacao` | `include: { veiculo: true }` |
| Devolução somente pelo proprietário | `finalizarLocacao` | `findFirst({ where: { id, usuarioId } })` |
| Devolução repetida impedida | `finalizarLocacao` | Atualização condicional e `count === 1` |
| Data efetiva no backend / liberação | `finalizarLocacao` | `new Date()` e atualização do veículo na transação |
| HTTP e mensagens coerentes | `lib/errors.ts`, Controllers | 201, 200, 400, 401, 404, 409 e erros inesperados |
| React, estados e formulários | `frontend/src/` | Campos controlados, eventos e componentes |
| API real e atualização | Cliente HTTP e componentes React | `fetch`, Bearer e recarga dos dados |
| Carregamento, erro e lista vazia | Componentes React | Conferir estados de cada tela |
| Expiração e logout | Sessão e cliente HTTP do frontend | Limpar autenticação e permitir novo login |
| Seed e variáveis | `backend/prisma/seed.ts`, `.env.example` | Dados fictícios e ausência de segredo real |
| Scripts e lock | `package.json`, `package-lock.json` | Instalação reprodutível e comandos documentados |
| CORS | `backend/src/app.ts`, `lib/config.ts` | Origem configurável |
| Sem comentários explicativos no fonte | `backend/src/`, `frontend/src/` | Explicações concentradas no README e docs |
| Diagramas digitais correspondentes | `docs/diagramas.md` | Conferir com schema e Services |
| Guia A–E e apresentação | `docs/guia-estudo.md`, `roteiro-apresentacao.md` | Treinar localização e explicação do código |

## Limites do escopo

Não foram solicitados pagamentos, multas, reservas futuras, perfis administrativos, edição ou exclusão. O total é o valor contratado, sem recálculo por devolução antecipada ou atrasada. O histórico permanece no banco.

## Entregas que dependem dos alunos

- Preencher identificação no README.
- Elaborar individualmente DER, sequência e respostas A–E manuscritas em A4 branco sem pautas ou quadriculados.
- Organizar e identificar as folhas com nome completo para entrega física ao professor.
- Participar da apresentação e responder à pergunta oral sobre qualquer parte do código.
- Confirmar a exigência verbal da “carta”: conteúdo, formato e canal ainda desconhecidos.
- Revisar a execução real e o envio do link GitHub conforme [checklist-entrega.md](checklist-entrega.md).
