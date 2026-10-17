import type { Armazenamento } from "./armazenamento";

export type { Armazenamento } from "./armazenamento";

/** Na web o expo-file-system não existe: usamos o localStorage (o snapshot tem ~0,5 MB). */
export const armazenamento: Armazenamento = {
  async ler(nome) {
    try {
      return globalThis.localStorage?.getItem(`tem-remedio:${nome}`) ?? null;
    } catch {
      return null;
    }
  },
  async gravar(nome, conteudo) {
    try {
      globalThis.localStorage?.setItem(`tem-remedio:${nome}`, conteudo);
    } catch {
      // Navegador sem espaço ou em modo privado: segue com o snapshot em memória.
    }
  },
};
