# Roteiro de apresentação e rotas

## Preparação

Execute instalação, configuração do MySQL, migrations e seed conforme o README. Inicie backend e frontend em terminais separados. Confira os resultados em `docs/verificacao.md`. Deixe abertos o navegador, terminal, `schema.prisma`, `routes.ts`, `locacao.service.ts`, `auth.ts` e `RentalForm.tsx`.

Os usuários fictícios são `ana@example.com` e `bruno@example.com`, ambos com senha `Estudo@12345`. Não apresente `.env`, segredos reais ou um token pessoal em arquivo versionado. Um token de demonstração é temporário.

## Demonstração sugerida

1. Apresente o problema: frota disponível, contratação por usuário autenticado e histórico preservado. Mostre rapidamente os três modelos e as duas relações 1:N.
2. Cadastre uma pessoa fictícia pela interface. Faça login e mostre o nome autenticado. Explique que o backend salva hash bcrypt e retorna JWT sem senha.
3. Mostre a frota e alterne “Somente disponíveis”. Cadastre um veículo fictício com placa nova e diária positiva. Mostre um erro de placa repetida.
4. Escolha um veículo disponível. Informe início e devolução prevista com 25 horas de diferença. Confirme que o total retornado equivale a duas diárias.
5. Mostre o veículo indisponível e a locação ativa no histórico. Localize `registrarLocacao` e explique atualização condicional, verificação de `count` e transação.
6. Finalize a locação e mostre a data efetiva, status finalizado e veículo liberado. Explique que o valor contratado e o histórico permanecem.
7. Saia e entre como outro usuário. Mostre que o histórico anterior não aparece. Explique o filtro por `usuarioId` obtido pelo JWT.
8. Execute algumas rotas no terminal e mostre os códigos HTTP. Use os exemplos completos do README.
9. Apresente o teste real de concorrência e seu resultado registrado. Não apresente teste não executado como aprovado.
10. Mostre os diagramas de estudo e explique que a entrega individual será manuscrita.

## Sequência de rotas no terminal

| Passo | Requisição | Resultado a observar |
|---|---|---|
| 1 | `POST /usuarios` com dados inéditos | 201, dados públicos sem senha |
| 2 | `POST /login` | 200, token e usuário |
| 3 | `GET /veiculos` sem Bearer | 401 |
| 4 | `GET /veiculos?disponivel=true` com Bearer | Lista de disponíveis |
| 5 | `POST /locacoes` com ID disponível e datas válidas | 201, total e veículo indisponível |
| 6 | Nova locação do mesmo veículo | 409 |
| 7 | `GET /locacoes` | Apenas histórico do usuário autenticado |
| 8 | Devolução com token de outro usuário | 404, sem revelar a locação |
| 9 | `PATCH /locacoes/:id/devolucao` com token do dono | 200, finalizada, devolução efetiva e veículo disponível |
| 10 | Repetir a devolução | 409 |

Use IDs retornados pela própria execução. Quando demonstrar dois usuários, mantenha tokens em variáveis separadas para não confundir propriedade. O backend calcula o valor e não aceita o `usuarioId` livre na entrada da locação.

## Treino individual

Cada integrante deve conseguir localizar e explicar todos os itens, mesmo que tenha estudado mais uma área:

- Entidades, FKs, unicidade e diferença entre índice e chave única.
- Caminho requisição → middleware → Controller → Service → Prisma.
- Comparação bcrypt e verificação JWT.
- Por que `include` retorna o veículo no histórico.
- Como se arredondam 24, 25 e 48 horas.
- Por que a transação evita persistência parcial e a atualização condicional evita duplicidade.
- Como o formulário controlado dispara a API e recarrega o estado.

Faça uma rodada sem ler respostas prontas. Uma pessoa aponta um método; outra explica entradas, regras, saída e possível falha. Consulte o [guia A–E](guia-estudo.md) para perguntas específicas.

## Antes de encerrar

Registre limitações e verificações ainda necessárias com honestidade. Confirme identificação e link do repositório, organização dos manuscritos e participação de todos. A “carta” é a própria entrega manuscrita já prevista: cada integrante deve entregar um DER, um diagrama de sequência com o caso de veículo indisponível e cinco respostas, todos à mão em A4 branco sem pautas ou quadriculados e identificados com nome completo.
