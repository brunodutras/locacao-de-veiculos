# Diagramas de referência

Estes diagramas refletem `backend/prisma/schema.prisma` e o fluxo de `registrarLocacao`. São material de estudo: cada aluno deve produzir sua versão individual, inteiramente à mão, em papel A4 branco sem pautas ou quadriculados, com nome completo. Não entregar impressão destes diagramas como manuscrito.

## DER

```mermaid
erDiagram
    Usuario ||--o{ Locacao : realiza
    Veiculo ||--o{ Locacao : possui_historico
    Usuario {
        Int id PK "autoincremento"
        String nome "VarChar(100)"
        String email UK "VarChar(191)"
        String senha "VarChar(60), hash bcrypt"
        DateTime dataCadastro "DateTime(3), default now"
    }
    Veiculo {
        Int id PK "autoincremento"
        String marca "VarChar(60)"
        String modelo "VarChar(80)"
        String placa UK "VarChar(7)"
        Int ano
        Decimal valorDiaria "Decimal(10,2), positivo"
        Boolean disponivel "default true"
    }
    Locacao {
        Int id PK "autoincremento"
        Int usuarioId FK
        Int veiculoId FK
        DateTime dataInicio "DateTime(3)"
        DateTime dataPrevistaDevolucao "DateTime(3), posterior ao início"
        DateTime dataDevolucao "DateTime(3), opcional"
        Decimal valorTotal "Decimal(12,2)"
        StatusLocacao status "ATIVA ou FINALIZADA, default ATIVA"
    }
```

`usuarioId` referencia `Usuario.id`; `veiculoId` referencia `Veiculo.id`. Ambos são obrigatórios e **não são únicos**. Isso permite muitas locações no histórico de um mesmo usuário e veículo. Os dois relacionamentos usam `onDelete: Restrict`, protegendo o histórico. Os índices compostos são `(usuarioId, dataInicio)` e `(veiculoId, status)`; índice não significa restrição de unicidade. E-mail e placa têm unicidade própria.

A consistência de disponibilidade é assegurada pelo Service transacional. `disponivel` não representa agenda de reservas: a locação iniciada já ocupa o veículo, independentemente do período informado. Não há recurso de reserva futura.

## Sequência — registrar locação

```mermaid
sequenceDiagram
    actor U as Usuário
    participant R as React
    participant C as Route/Controller
    participant S as Service
    participant B as Prisma/Banco MySQL
    U->>R: Selecionar veículo, início e devolução prevista
    R->>C: POST /locacoes + Bearer JWT + dados ISO
    C->>C: autenticar: verificar assinatura, expiração, sub
    C->>B: Consultar Usuario.id do token
    B-->>C: Usuário autenticado
    C->>S: registrarLocacao(res.locals.usuarioId, req.body)
    S->>S: locacaoSchema.parse e validar fim posterior ao início
    S->>B: Iniciar prisma.$transaction
    S->>B: tx.veiculo.findUnique(id)
    B-->>S: Veículo e valorDiaria
    S->>S: calcularValor: Decimal × ceil(duração / 24h)
    S->>B: updateMany WHERE id AND disponivel=true SET disponivel=false
    alt Exatamente um veículo atualizado
        B-->>S: count = 1
        S->>B: tx.locacao.create com usuarioId e include veiculo
        B-->>S: Locação ATIVA criada
        S->>B: COMMIT
        S-->>C: Locação com veículo e valorTotal
        C-->>R: HTTP 201 + JSON
        R->>R: Atualizar frota e histórico pela API
        R-->>U: Exibir sucesso e veículo indisponível
    else Veículo indisponível ou outra requisição venceu
        B-->>S: count = 0
        S->>B: ROLLBACK da transação
        S-->>C: AppError 409 Veículo indisponível
        C-->>R: HTTP 409 + mensagem
        R-->>U: Exibir conflito e opção Atualizar dados
    end
```

Antes da transação, datas inválidas produzem 400. Dentro dela, veículo inexistente produz 404. Token ausente, inválido ou expirado interrompe o fluxo antes do Controller protegido com 401. Exceções após a alteração da disponibilidade também desfazem a transação, sem locação ou bloqueio parcial persistido. A verificação decisiva de disponibilidade é a atualização condicional; a consulta do veículo serve para existência e diária.

Na devolução, `finalizarLocacao` consulta uma locação do proprietário, atualiza condicionalmente `ATIVA` com `dataDevolucao = null`, exige `count = 1`, libera o veículo e confirma tudo na mesma transação. Uma repetição retorna 409; outro usuário recebe 404, sem revelar a locação.
