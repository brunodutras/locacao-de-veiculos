# Verificação realizada

Execução em 28/10/2026, no macOS ARM64, com Node.js 24.15.0 e npm 11.12.1. Resultados abaixo são verificações realizadas nesta máquina, não apenas casos de teste preparados.

## Resultados

| Verificação | Resultado |
|---|---|
| `npm install` e lockfile | Dependências instaladas e `package-lock.json` versionado |
| `npm run db:generate -w backend` | Prisma Client 6.19.3 gerado |
| `npm run db:migrate -w backend` | Migration aplicada em MySQL 8.4.13 real |
| `npm run db:seed -w backend` duas vezes | Execuções concluídas, sem duplicar usuários ou veículos |
| `npm run typecheck` | Backend, testes, seed e frontend aprovados |
| `npm run lint` | Aprovado |
| `npm run build` | Backend e frontend compilados |
| `npm test` | 5 testes aprovados, zero falhas |
| `npm run test:integration -w backend` | 8 testes HTTP/MySQL aprovados, zero falhas |
| `npm audit` | Zero vulnerabilidades reportadas na execução final |
| Interface no Chrome | Cadastro de usuário, login, logout, cadastro de veículo, seleção, locação, filtro, histórico e devolução conferidos |
| Layout móvel | Conferido em viewport de 390 × 844; conteúdo sem transbordamento horizontal |

A suíte HTTP verifica cadastro e login, bcrypt, conteúdo do JWT, e-mail/placa duplicados, ausência/invalidade/expiração de token em todas as rotas protegidas, campos inválidos, datas sem fuso/invertidas/iguais, identidade indevida no corpo, veículo inexistente/indisponível, consulta restrita e devolução de outro proprietário, histórico e repetição de devolução.

**Concorrência comprovada:** duas requisições HTTP simultâneas para um veículo produziram respostas 201 e 409; a consulta posterior confirmou exatamente uma locação ATIVA e veículo indisponível. Duas devoluções simultâneas produziram 200 e 409 e liberaram o veículo.

**Rollback comprovado:** o teste chama o Service com um ID de usuário inexistente no banco dedicado. A atualização de disponibilidade acontece, mas a criação falha na chave estrangeira; a transação restaura o veículo para disponível e não grava locação. Esse ID não é aceito livremente pela API.

**Cálculo:** os testes unitários confirmam 24, 25 e 48 horas, datas inválidas, precisão decimal e teto do total. No navegador, a locação de um Fiat Argo por 25 horas resultou em R$ 259,80 (duas diárias de R$ 129,90), seguida de devolução e histórico finalizado.

## Dependências

As versões estão fixadas no lockfile. O override `deepmerge-ts: 8.0.2` na raiz corrige a dependência interna de configuração do Prisma 6.19.3. A resolução limpa foi conferida no lockfile e na versão instalada, seguida da geração do Client, aplicação de migrations e suíte real. `npm ci --ignore-scripts` também reproduziu a instalação. O npm 11.12.1 pode apresentar essa resolução como `invalid` em `npm ls` por compará-la ao pin original 7.1.5 do Prisma; é um override explícito, e os comandos de instalação, geração, migration e testes foram verificados. O projeto usa a função `deepmerge` da ferramenta sem configuração baseada em Maps; as mudanças maiores de Maps e tipos da versão 8 não participam do código da aplicação. Referências: [aviso corrigido](https://github.com/advisories/GHSA-ggr8-5vv4-36mx) e [release do mantenedor](https://github.com/RebeccaStevens/deepmerge-ts/releases/tag/v8.0.0). Reavalie esse override quando atualizar o Prisma.

## Ambiente local preparado nesta sessão

Não havia MySQL ou Docker instalado. Foi baixado o arquivo oficial `mysql-8.4.13-macos15-arm64.tar.gz` para `/tmp`; seu MD5 coincidiu com o publicado pelo fornecedor. A instância foi inicializada sem instalar um serviço permanente e limitada a `127.0.0.1:3307`, com bancos separados `locacao` e `locacao_test` e usuário fictício próprio. O Compose não foi executado nesta máquina.

Os arquivos locais ignorados `backend/.env` e `frontend/.env` foram preparados para essa execução. O segredo JWT local é aleatório e não foi incluído no Git. Os exemplos versionados usam a porta padrão 3306 para a opção Compose ou uma instalação própria; não copie o exemplo sobre sua configuração atual sem ajustar a porta.

A instância temporária, a API em `http://localhost:3000` e o Vite em `http://localhost:5173` foram iniciados para a demonstração. Se os processos forem encerrados ou `/tmp` for limpo, siga a instalação do README para manter seu próprio MySQL. Enquanto os arquivos temporários existirem, é possível reiniciar a instância com:

```bash
/tmp/locacao-mysql-bin/bin/mysqld --no-defaults \
  --basedir=/tmp/locacao-mysql-bin \
  --datadir=/tmp/locacao-mysql-data-real \
  --bind-address=127.0.0.1 --port=3307 \
  --socket=/tmp/locacao-mysql.sock \
  --pid-file=/tmp/locacao-mysql.pid \
  --log-error=/tmp/locacao-mysql-server.log \
  --mysqlx=OFF --default-time-zone=+00:00
```

O processo ocupa esse terminal. Não execute novamente se o banco já estiver ativo. Em outros terminais, use os comandos `npm run dev -w backend` e `npm run dev -w frontend` da raiz do repositório.

Os dados de seed são Ana e Bruno com senha fictícia `Estudo@12345`, além de Argo, Onix e Corolla. A conferência manual acrescentou `interface@example.com` (mesma senha fictícia), um Polo `WEB1A23` e uma locação finalizada de Ana. Esses registros existem apenas no banco local; não são necessários para reproduzir o seed. Os registros da suíte automatizada foram removidos pelo próprio teste, preservando os demais dados.

## Código, materiais e Git

O repositório existente foi clonado em `locacao-de-veiculos/`; o remote `origin` aponta para `https://github.com/brunodutras/locacao-de-veiculos.git`. O remoto estava vazio. O arquivo vazio `../locaca` e os materiais em `../materiais` foram preservados. O enunciado e o exercício React foram inspecionados; as apostilas de React, relacionamentos e JWT foram extraídas e consultadas como apoio.

Foi preparado um commit local com a implementação e a documentação. Consulte `git log -1 --oneline` para identificá-lo. Não houve push, publicação, deploy ou alteração de visibilidade. `.env`, `node_modules` e builds estão ignorados.

## Limitações e ações restantes

- Configurar um MySQL durável na máquina da apresentação; o banco usado nesta sessão é temporário. O Compose está preparado, mas não foi executado aqui.
- Os testes de integração exigem banco dedicado terminado em `_test`, aplicam migrations e limpam somente os registros que criam. Não apontar para dados de produção.
- A revisão visual foi feita no Chrome em desktop e em um tamanho móvel; não equivale a uma matriz de navegadores ou auditoria completa de acessibilidade. A expiração foi testada na API; a interface tem temporizador e tratamento de 401, mas não se aguardou uma hora no navegador.
- O projeto permanece no escopo acadêmico: não implementa revogação de JWT ou funcionalidades comerciais adicionais.
- Preencher identificação dos integrantes no README.
- Cada aluno deve preparar individualmente os diagramas e as cinco respostas manuscritas, em A4 branco sem pautas ou quadriculados, e treinar a apresentação.
- A “carta” foi esclarecida como a própria entrega manuscrita individual: um DER, um diagrama de sequência e cinco respostas. Não há documento extra a confirmar; produzir e entregar os manuscritos continua sendo responsabilidade de cada aluno.
- Revisar o commit local e autorizar/realizar o push para entregar o link do repositório.

## Evidências da interface

[Desktop com histórico de devolução](interface-desktop.png) · [Tela móvel](interface-mobile.png)
