import { useState, type FormEvent } from "react";
import { solicitar } from "../api";
import type { Sessao } from "../types";

export default function AuthForm({
  onLogin,
}: {
  onLogin: (sessao: Sessao) => void;
}) {
  const [cadastro, setCadastro] = useState(false);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setEnviando(true);
    setErro("");
    setMensagem("");
    try {
      if (new TextEncoder().encode(senha).length > 72)
        throw new Error(
          "A senha deve ter até 72 bytes. Acentos e símbolos podem ocupar mais de um byte.",
        );
      if (cadastro) {
        await solicitar("/usuarios", {
          method: "POST",
          body: JSON.stringify({ nome, email, senha }),
        });
        setCadastro(false);
        setSenha("");
        setMensagem("Conta criada. Entre com seu e-mail e senha.");
      } else {
        onLogin(
          await solicitar<Sessao>("/login", {
            method: "POST",
            body: JSON.stringify({ email, senha }),
          }),
        );
      }
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Erro inesperado.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="auth-layout">
      <section className="auth-intro">
        <span className="eyebrow">SEU PRÓXIMO CAMINHO</span>
        <h1>
          Uma frota.
          <br />
          Muitas possibilidades.
        </h1>
        <p>
          Escolha um veículo, defina seu período e acompanhe cada locação em um
          só lugar.
        </p>
        <div className="road-art" aria-hidden="true">
          <div className="road-line" />
          <span>R</span>
          <div className="road-dot" />
        </div>
        <div className="auth-footnote">
          <span>01 / ESCOLHA</span>
          <span>02 / CONTRATE</span>
          <span>03 / DEVOLVA</span>
        </div>
      </section>
      <section className="auth-card card">
        <span className="eyebrow">BEM-VINDO À ROTA</span>
        <h2>{cadastro ? "Crie sua conta" : "Vamos começar?"}</h2>
        <p className="muted">
          {cadastro
            ? "Seus dados para acessar a frota."
            : "Entre para gerenciar suas locações."}
        </p>
        <div className="segmented" aria-label="Acesso">
          <button
            type="button"
            className={!cadastro ? "selected" : ""}
            disabled={enviando}
            onClick={() => {
              setCadastro(false);
              setErro("");
            }}
          >
            Entrar
          </button>
          <button
            type="button"
            className={cadastro ? "selected" : ""}
            disabled={enviando}
            onClick={() => {
              setCadastro(true);
              setErro("");
            }}
          >
            Criar conta
          </button>
        </div>
        <form onSubmit={enviar}>
          {cadastro && (
            <label>
              Nome completo
              <input
                required
                minLength={2}
                maxLength={100}
                autoComplete="name"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Como podemos chamar você?"
              />
            </label>
          )}
          <label>
            E-mail
            <input
              type="email"
              required
              maxLength={191}
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@exemplo.com"
            />
          </label>
          <label>
            Senha
            <input
              type="password"
              required
              minLength={cadastro ? 8 : 1}
              maxLength={72}
              autoComplete={cadastro ? "new-password" : "current-password"}
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder={cadastro ? "Pelo menos 8 caracteres" : "Sua senha"}
            />
          </label>
          {erro && (
            <p className="notice error" role="alert">
              {erro}
            </p>
          )}
          {mensagem && (
            <p className="notice success" role="status">
              {mensagem}
            </p>
          )}
          <button className="primary wide" disabled={enviando}>
            {enviando
              ? "Aguarde…"
              : cadastro
                ? "Criar minha conta"
                : "Entrar na plataforma"}
            <span aria-hidden="true">↗</span>
          </button>
        </form>
        <p className="small muted">
          Projeto acadêmico · Programação com Frameworks Web
        </p>
      </section>
    </main>
  );
}
