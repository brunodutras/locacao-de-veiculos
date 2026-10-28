const base = (import.meta.env.VITE_API_URL || "http://localhost:3000").replace(
  /\/$/,
  "",
);

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

export async function solicitar<T>(
  rota: string,
  opcoes: RequestInit = {},
  token?: string,
): Promise<T> {
  let resposta: Response;
  try {
    resposta = await fetch(`${base}${rota}`, {
      ...opcoes,
      headers: {
        ...(opcoes.body ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...opcoes.headers,
      },
    });
  } catch {
    throw new Error(
      "Não foi possível conectar à API. Confira se o backend está em execução.",
    );
  }
  const dados = await resposta.json().catch(() => null);
  if (!resposta.ok)
    throw new ApiError(
      dados?.mensagem || "Não foi possível concluir a operação.",
      resposta.status,
    );
  return dados as T;
}

export const dinheiro = (valor: string) =>
  Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export const dataHora = (valor: string) =>
  new Date(valor).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
