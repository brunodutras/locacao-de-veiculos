import { useState, type FormEvent } from "react";
import type { Veiculo } from "../types";
import { dinheiro } from "../api";

export default function RentalForm({
  veiculos,
  selecionado,
  onSelect,
  onSave,
  busy,
}: {
  veiculos: Veiculo[];
  selecionado: string;
  onSelect: (id: string) => void;
  onSave: (dados: object) => Promise<boolean>;
  busy: boolean;
}) {
  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");
  const [erro, setErro] = useState("");
  const disponiveis = veiculos.filter((v) => v.disponivel);
  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro("");
    if (!inicio || !fim || new Date(fim) <= new Date(inicio)) {
      setErro("A devolução prevista deve ser posterior ao início.");
      return;
    }
    if (
      await onSave({
        veiculoId: Number(selecionado),
        dataInicio: new Date(inicio).toISOString(),
        dataPrevistaDevolucao: new Date(fim).toISOString(),
      })
    ) {
      setInicio("");
      setFim("");
      onSelect("");
    }
  }
  return (
    <section className="card rental-panel" id="nova-locacao">
      <div className="section-heading">
        <div>
          <span className="eyebrow">SEU PRÓXIMO TRAJETO</span>
          <h2>Nova locação</h2>
        </div>
        <span className="step-number" aria-hidden="true">
          ↗
        </span>
      </div>
      <form onSubmit={enviar}>
        <label>
          Veículo
          <select
            required
            value={selecionado}
            onChange={(e) => onSelect(e.target.value)}
          >
            <option value="">Selecione um veículo disponível</option>
            {disponiveis.map((v) => (
              <option key={v.id} value={v.id}>
                {v.marca} {v.modelo} · {v.placa} · {dinheiro(v.valorDiaria)}/dia
              </option>
            ))}
          </select>
        </label>
        <div className="form-grid">
          <label>
            Data e hora de início
            <input
              type="datetime-local"
              required
              value={inicio}
              onChange={(e) => setInicio(e.target.value)}
            />
          </label>
          <label>
            Devolução prevista
            <input
              type="datetime-local"
              required
              value={fim}
              onChange={(e) => setFim(e.target.value)}
            />
          </label>
        </div>
        <div className="hint">
          <span aria-hidden="true">◷</span>
          <p>
            Cada período de até 24 horas conta como uma diária. O valor
            definitivo é calculado pela API. Horários no fuso do seu
            dispositivo.
          </p>
        </div>
        {erro && (
          <p className="notice error" role="alert">
            {erro}
          </p>
        )}
        <button
          className="primary wide"
          disabled={busy || disponiveis.length === 0}
        >
          {busy ? "Registrando…" : "Confirmar locação"}
          <span aria-hidden="true">→</span>
        </button>
        {disponiveis.length === 0 && (
          <p className="small muted">Nenhum veículo disponível no momento.</p>
        )}
      </form>
    </section>
  );
}
