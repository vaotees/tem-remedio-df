import { Directory, File, Paths } from "expo-file-system";

/** Onde o app guarda o último snapshot baixado. No celular: um arquivo na pasta do app. */
export interface Armazenamento {
  ler(nome: string): Promise<string | null>;
  gravar(nome: string, conteudo: string): Promise<void>;
}

const pasta = () => new Directory(Paths.document, "dados");

export const armazenamento: Armazenamento = {
  async ler(nome) {
    const arquivo = new File(pasta(), nome);
    return arquivo.exists ? arquivo.text() : null;
  },
  async gravar(nome, conteudo) {
    const dir = pasta();
    if (!dir.exists) dir.create();
    const arquivo = new File(dir, nome);
    if (!arquivo.exists) arquivo.create();
    await arquivo.write(conteudo);
  },
};
