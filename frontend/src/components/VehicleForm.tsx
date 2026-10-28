import { useState, type FormEvent } from "react";

export default function VehicleForm({
  onSave,
  busy,
}: {
  onSave: (dados: object) => Promise<boolean>;
  busy: boolean;
}) {
  const [dados, setDados] = useState({
    marca: "",
    modelo: "",
    placa: "",
    ano: String(new Date().getFullYear()),
    valorDiaria: "",
  });
  const campo = (nome: keyof typeof dados, valor: string) =>
    setDados((atual) => ({ ...atual, [nome]: valor }));
  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (
      await onSave({
        ...dados,
        ano: Number(dados.ano),
        valorDiaria: dados.valorDiaria,
      })
    )
      setDados({
        marca: "",
        modelo: "",
        placa: "",
        ano: String(new Date().getFullYear()),
        valorDiaria: "",
      });
  }
  return (
    <form className="vehicle-form" onSubmit={enviar}>
      <label>
        Marca
        <input
          required
          maxLength={60}
          value={dados.marca}
          onChange={(e) => campo("marca", e.target.value)}
          placeholder="Ex.: Volkswagen"
        />
      </label>
      <label>
        Modelo
        <input
          required
          maxLength={80}
          value={dados.modelo}
          onChange={(e) => campo("modelo", e.target.value)}
          placeholder="Ex.: Polo"
        />
      </label>
      <label>
        Placa
        <input
          required
          maxLength={8}
          value={dados.placa}
          onChange={(e) => campo("placa", e.target.value.toUpperCase())}
          placeholder="ABC1D23"
        />
      </label>
      <label>
        Ano
        <input
          required
          type="number"
          min="1900"
          max={new Date().getFullYear() + 1}
          value={dados.ano}
          onChange={(e) => campo("ano", e.target.value)}
        />
      </label>
      <label>
        Diária (R$)
        <input
          required
          type="number"
          min="0.01"
          max="99999999.99"
          step="0.01"
          value={dados.valorDiaria}
          onChange={(e) => campo("valorDiaria", e.target.value)}
          placeholder="150,00"
        />
      </label>
      <button className="primary" disabled={busy}>
        {busy ? "Salvando…" : "Cadastrar veículo"}
      </button>
    </form>
  );
}
