import type { Locacao } from "../types";
import { dinheiro, dataHora } from "../api";

export default function RentalHistory({
  locacoes,
  onReturn,
  busy,
}: {
  locacoes: Locacao[];
  onReturn: (id: number) => void;
  busy: boolean;
}) {
  return (
    <section className="card history-panel">
      <div className="section-heading">
        <div>
          <span className="eyebrow">TUDO NO SEU CAMINHO</span>
          <h2>Minhas locações</h2>
        </div>
        <span className="counter">{locacoes.length}</span>
      </div>
      {locacoes.length === 0 ? (
        <div className="empty">
          <span aria-hidden="true">↗</span>
          <h3>Sua primeira viagem começa aqui</h3>
          <p>
            Escolha um veículo para começar. Seu histórico aparecerá neste
            espaço.
          </p>
        </div>
      ) : (
        <div className="rental-list">
          {locacoes.map((locacao) => (
            <article className="rental-item" key={locacao.id}>
              <div className="rental-title">
                <div>
                  <span className="small muted">
                    LOCAÇÃO #{String(locacao.id).padStart(3, "0")}
                  </span>
                  <h3>
                    {locacao.veiculo.marca} {locacao.veiculo.modelo}
                  </h3>
                  <span className="plate">{locacao.veiculo.placa}</span>
                </div>
                <span
                  className={`badge ${locacao.status === "ATIVA" ? "active" : "finished"}`}
                >
                  {locacao.status === "ATIVA" ? "Em andamento" : "Finalizada"}
                </span>
              </div>
              <dl className="rental-dates">
                <div>
                  <dt>Início</dt>
                  <dd>{dataHora(locacao.dataInicio)}</dd>
                </div>
                <div>
                  <dt>Devolução prevista</dt>
                  <dd>{dataHora(locacao.dataPrevistaDevolucao)}</dd>
                </div>
                {locacao.dataDevolucao && (
                  <div>
                    <dt>Devolução efetiva</dt>
                    <dd>{dataHora(locacao.dataDevolucao)}</dd>
                  </div>
                )}
              </dl>
              <div className="rental-bottom">
                <div>
                  <span className="small muted">VALOR CONTRATADO</span>
                  <strong>{dinheiro(locacao.valorTotal)}</strong>
                </div>
                {locacao.status === "ATIVA" && (
                  <button
                    className="secondary"
                    disabled={busy}
                    onClick={() => onReturn(locacao.id)}
                  >
                    Registrar devolução <span aria-hidden="true">↩</span>
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
