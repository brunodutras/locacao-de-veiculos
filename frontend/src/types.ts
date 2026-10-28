export type Usuario = {
  id: number;
  nome: string;
  email: string;
  dataCadastro: string;
};
export type Sessao = { token: string; usuario: Usuario };
export type Veiculo = {
  id: number;
  marca: string;
  modelo: string;
  placa: string;
  ano: number;
  valorDiaria: string;
  disponivel: boolean;
};
export type Locacao = {
  id: number;
  usuarioId: number;
  veiculoId: number;
  dataInicio: string;
  dataPrevistaDevolucao: string;
  dataDevolucao: string | null;
  valorTotal: string;
  status: "ATIVA" | "FINALIZADA";
  veiculo: Veiculo;
};
