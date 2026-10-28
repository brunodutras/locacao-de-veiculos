import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, dinheiro, solicitar } from "./api";
import type { Locacao, Sessao, Veiculo } from "./types";
import AuthForm from "./components/AuthForm";
import VehicleForm from "./components/VehicleForm";
import RentalForm from "./components/RentalForm";
import RentalHistory from "./components/RentalHistory";

function lerSessao(): Sessao | null {
  try {
    const salva: unknown = JSON.parse(
      sessionStorage.getItem("rota-sessao") || "null",
    );
    if (
      salva &&
      typeof salva === "object" &&
      "token" in salva &&
      "usuario" in salva &&
      typeof salva.token === "string" &&
      salva.usuario &&
      typeof salva.usuario === "object" &&
      "nome" in salva.usuario &&
      typeof salva.usuario.nome === "string"
    )
      return salva as Sessao;
  } catch {
    sessionStorage.removeItem("rota-sessao");
  }
  return null;
}

export default function App() {
  const [sessao, setSessao] = useState<Sessao | null>(lerSessao);
  const sessaoAtual = useRef(sessao);
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [locacoes, setLocacoes] = useState<Locacao[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [filtro, setFiltro] = useState(false);
  const [mostrarCadastro, setMostrarCadastro] = useState(false);
  const [selecionado, setSelecionado] = useState("");

  const sair = useCallback((expirada = false) => {
    sessionStorage.removeItem("rota-sessao");
    sessaoAtual.current = null;
    setSessao(null);
    setOcupado(false);
    setCarregando(false);
    setVeiculos([]);
    setLocacoes([]);
    setSelecionado("");
    setSucesso("");
    setErro(
      expirada
        ? "Sua sessão expirou ou é inválida. Entre novamente para continuar."
        : "",
    );
  }, []);

  const tratarErro = useCallback(
    (error: unknown) => {
      if (error instanceof ApiError && error.status === 401) sair(true);
      else
        setErro(
          error instanceof Error
            ? error.message
            : "Ocorreu um erro inesperado.",
        );
    },
    [sair],
  );

  const carregar = useCallback(async (token: string, signal?: AbortSignal) => {
    const [frota, historico] = await Promise.all([
      solicitar<Veiculo[]>("/veiculos", { signal }, token),
      solicitar<Locacao[]>("/locacoes", { signal }, token),
    ]);
    if (!signal?.aborted && sessaoAtual.current?.token === token) {
      setSelecionado((atual) =>
        frota.some(
          (veiculo) => String(veiculo.id) === atual && veiculo.disponivel,
        )
          ? atual
          : "",
      );
      setVeiculos(frota);
      setLocacoes(historico);
    }
  }, []);

  useEffect(() => {
    if (!sessao) return;
    const controle = new AbortController();
    setCarregando(true);
    carregar(sessao.token, controle.signal)
      .catch((error) => {
        if (
          !controle.signal.aborted &&
          sessaoAtual.current?.token === sessao.token
        )
          tratarErro(error);
      })
      .finally(() => {
        if (
          !controle.signal.aborted &&
          sessaoAtual.current?.token === sessao.token
        )
          setCarregando(false);
      });
    return () => controle.abort();
  }, [sessao, carregar, tratarErro]);

  useEffect(() => {
    if (!sessao) return;
    let tempo: ReturnType<typeof setTimeout>;
    try {
      const payload = JSON.parse(
        atob(sessao.token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")),
      ) as { exp?: number };
      const restante = (payload.exp || 0) * 1000 - Date.now();
      tempo = setTimeout(
        () => {
          if (sessaoAtual.current?.token === sessao.token) sair(true);
        },
        Math.min(Math.max(restante, 0), 2_147_483_647),
      );
    } catch {
      tempo = setTimeout(() => {
        if (sessaoAtual.current?.token === sessao.token) sair(true);
      }, 0);
    }
    return () => clearTimeout(tempo);
  }, [sessao, sair]);

  function entrar(nova: Sessao) {
    sessionStorage.setItem("rota-sessao", JSON.stringify(nova));
    setErro("");
    setSucesso("");
    sessaoAtual.current = nova;
    setSessao(nova);
  }

  async function atualizar() {
    if (!sessao) return;
    const token = sessao.token;
    setCarregando(true);
    setErro("");
    try {
      await carregar(token);
    } catch (error) {
      if (sessaoAtual.current?.token === token) tratarErro(error);
    } finally {
      if (sessaoAtual.current?.token === token) setCarregando(false);
    }
  }

  async function executar(
    rota: string,
    metodo: string,
    dados: object | undefined,
    mensagem: string,
  ): Promise<boolean> {
    if (!sessao || ocupado) return false;
    const token = sessao.token;
    setOcupado(true);
    setErro("");
    setSucesso("");
    try {
      await solicitar(
        rota,
        { method: metodo, ...(dados ? { body: JSON.stringify(dados) } : {}) },
        token,
      );
      if (sessaoAtual.current?.token !== token) return false;
      setSucesso(mensagem);
      try {
        await carregar(token);
      } catch (error) {
        if (sessaoAtual.current?.token === token) tratarErro(error);
      }
      return true;
    } catch (error) {
      if (sessaoAtual.current?.token === token) tratarErro(error);
      return false;
    } finally {
      if (sessaoAtual.current?.token === token) setOcupado(false);
    }
  }

  const exibidos = filtro ? veiculos.filter((v) => v.disponivel) : veiculos;
  const disponiveis = veiculos.filter((v) => v.disponivel).length;
  const ativas = locacoes.filter((l) => l.status === "ATIVA").length;

  return (
    <>
      <header className="topbar">
        <a className="brand" href="#" aria-label="Rota início">
          <span className="brand-mark" aria-hidden="true">
            r.
          </span>
          <span>
            rota<span className="brand-dot">.</span>
          </span>
          <small>LOCAÇÃO DE VEÍCULOS</small>
        </a>
        {sessao ? (
          <div className="user-menu">
            <span className="avatar" aria-hidden="true">
              {sessao.usuario.nome.slice(0, 1).toUpperCase()}
            </span>
            <span className="user-name">{sessao.usuario.nome}</span>
            <button className="text-button" onClick={() => sair()}>
              Sair ↗
            </button>
          </div>
        ) : (
          <span className="header-caption">
            O caminho começa com uma escolha.
          </span>
        )}
      </header>
      {!sessao ? (
        <>
          {erro && (
            <div className="auth-notice notice error" role="alert">
              {erro}
            </div>
          )}
          <AuthForm onLogin={entrar} />
        </>
      ) : (
        <main className="dashboard">
          <section className="page-heading">
            <div>
              <span className="eyebrow">PLATAFORMA DE LOCAÇÃO</span>
              <h1>
                Seu caminho, sua escolha<span>.</span>
              </h1>
              <p className="muted">
                Gerencie a frota e acompanhe suas locações.
              </p>
            </div>
            <div className="heading-label">
              <span className="live-dot" /> ÁREA DO USUÁRIO
            </div>
          </section>
          <section className="stats" aria-label="Resumo">
            <article>
              <span className="stat-label">Veículos na frota</span>
              <strong>
                {carregando ? "—" : String(veiculos.length).padStart(2, "0")}
              </strong>
              <span className="stat-icon" aria-hidden="true">
                ▤
              </span>
            </article>
            <article>
              <span className="stat-label">Disponíveis agora</span>
              <strong>
                {carregando ? "—" : String(disponiveis).padStart(2, "0")}
              </strong>
              <span className="stat-icon" aria-hidden="true">
                ↗
              </span>
            </article>
            <article className="dark-stat">
              <span className="stat-label">Suas locações ativas</span>
              <strong>
                {carregando ? "—" : String(ativas).padStart(2, "0")}
              </strong>
              <span className="stat-icon" aria-hidden="true">
                ◷
              </span>
            </article>
          </section>
          {erro && (
            <p className="notice error" role="alert">
              {erro}{" "}
              <button
                className="text-button"
                disabled={ocupado || carregando}
                onClick={atualizar}
              >
                Atualizar dados
              </button>
            </p>
          )}
          {sucesso && (
            <p className="notice success" role="status">
              {sucesso}
            </p>
          )}
          {carregando ? (
            <div className="loading" role="status">
              <span className="spinner" /> Carregando sua frota e seu histórico…
            </div>
          ) : (
            <>
              <section className="fleet-section">
                <div className="section-heading">
                  <div>
                    <span className="eyebrow">
                      PRONTOS PARA O PRÓXIMO DESTINO
                    </span>
                    <h2>Explore a frota</h2>
                  </div>
                  <button
                    className="secondary"
                    onClick={() => setMostrarCadastro(!mostrarCadastro)}
                    aria-expanded={mostrarCadastro}
                  >
                    {mostrarCadastro
                      ? "Fechar cadastro"
                      : "+ Cadastrar veículo"}
                  </button>
                </div>
                {mostrarCadastro && (
                  <div className="card vehicle-form-card">
                    <h3>Adicionar à frota</h3>
                    <VehicleForm
                      busy={ocupado}
                      onSave={(dados) =>
                        executar(
                          "/veiculos",
                          "POST",
                          dados,
                          "Veículo cadastrado com sucesso.",
                        )
                      }
                    />
                  </div>
                )}
                <div className="fleet-toolbar">
                  <span className="small muted">
                    {exibidos.length}{" "}
                    {exibidos.length === 1
                      ? "veículo encontrado"
                      : "veículos encontrados"}
                  </span>
                  <label className="switch-label">
                    <input
                      type="checkbox"
                      checked={filtro}
                      onChange={(e) => setFiltro(e.target.checked)}
                    />
                    <span className="switch-track" />
                    Somente disponíveis
                  </label>
                </div>
                {exibidos.length === 0 ? (
                  <div className="card empty">
                    <h3>
                      {filtro
                        ? "Nenhum veículo disponível"
                        : "A frota está esperando o primeiro veículo"}
                    </h3>
                    <p>
                      {filtro
                        ? "Confira novamente após uma devolução."
                        : "Use “Cadastrar veículo” para adicionar um veículo à frota."}
                    </p>
                  </div>
                ) : (
                  <div className="vehicle-grid">
                    {exibidos.map((veiculo, indice) => (
                      <article className="card vehicle-card" key={veiculo.id}>
                        <div className={`vehicle-visual tone-${indice % 3}`}>
                          <span className="vehicle-category">FROTA ROTA</span>
                          <span
                            className={`badge ${veiculo.disponivel ? "active" : "unavailable"}`}
                          >
                            {veiculo.disponivel ? "Disponível" : "Em locação"}
                          </span>
                          <svg aria-hidden="true" viewBox="0 0 280 130">
                            <path d="M40 88 51 65 91 57 114 33 177 33 205 57 236 66 244 91Z" />
                            <path
                              className="window"
                              d="m101 57 19-18h23v18zm49 0V39h23l21 18z"
                            />
                            <path
                              className="car-line"
                              d="M41 91h202M56 69h21m135 0h18"
                            />
                            <circle cx="86" cy="92" r="17" />
                            <circle cx="205" cy="92" r="17" />
                            <circle className="hub" cx="86" cy="92" r="7" />
                            <circle className="hub" cx="205" cy="92" r="7" />
                          </svg>
                        </div>
                        <div className="vehicle-details">
                          <div>
                            <span className="small muted">
                              {veiculo.marca} · {veiculo.ano}
                            </span>
                            <h3>{veiculo.modelo}</h3>
                            <span className="plate">{veiculo.placa}</span>
                          </div>
                          <div className="vehicle-price">
                            <strong>{dinheiro(veiculo.valorDiaria)}</strong>
                            <span className="small muted">por diária</span>
                          </div>
                        </div>
                        <button
                          className={
                            veiculo.disponivel
                              ? "vehicle-action"
                              : "vehicle-action disabled"
                          }
                          disabled={!veiculo.disponivel || ocupado}
                          onClick={() => {
                            setSelecionado(String(veiculo.id));
                            document
                              .getElementById("nova-locacao")
                              ?.scrollIntoView({
                                behavior: "smooth",
                                block: "center",
                              });
                          }}
                        >
                          {veiculo.disponivel
                            ? "Escolher veículo"
                            : "Indisponível no momento"}
                          <span aria-hidden="true">↗</span>
                        </button>
                      </article>
                    ))}
                  </div>
                )}
              </section>
              <div className="rental-layout">
                <RentalForm
                  veiculos={veiculos}
                  selecionado={selecionado}
                  onSelect={setSelecionado}
                  busy={ocupado}
                  onSave={(dados) =>
                    executar(
                      "/locacoes",
                      "POST",
                      dados,
                      "Locação registrada. Boa viagem!",
                    )
                  }
                />
                <RentalHistory
                  locacoes={locacoes}
                  busy={ocupado}
                  onReturn={(id) => {
                    void executar(
                      `/locacoes/${id}/devolucao`,
                      "PATCH",
                      undefined,
                      "Devolução registrada. O veículo está disponível novamente.",
                    );
                  }}
                />
              </div>
            </>
          )}
          <footer>
            <span className="footer-brand">rota.</span>
            <span>Projeto acadêmico · Programação com Frameworks Web</span>
            <span>Um novo caminho a cada locação.</span>
          </footer>
        </main>
      )}
    </>
  );
}
