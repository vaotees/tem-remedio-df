import { useSyncExternalStore } from "react";
import { z } from "zod";
import { armazenamento } from "@/dados/armazenamento";

/** Tamanho da letra do app, por cima do ajuste do celular. */
export const ESCALAS_LETRA = { normal: 1, grande: 1.15, maior: 1.3 } as const;
export type Letra = keyof typeof ESCALAS_LETRA;

/** "sistema": segue o tema claro ou escuro do celular. */
export type PreferenciaTema = "sistema" | "claro" | "escuro";

const preferenciasSchema = z.object({
  /** Só para a saudação do Início ("Bom dia, Lúcia"). Opcional; fica só neste celular. */
  nome: z.string().trim().max(30).nullable().catch(null),
  letra: z.enum(["normal", "grande", "maior"]).catch("normal"),
  tema: z.enum(["sistema", "claro", "escuro"]).catch("sistema"),
});

export type Preferencias = z.infer<typeof preferenciasSchema>;

/** Fica só neste aparelho (LGPD): não vai para servidor nenhum. */
export const ARQUIVO_PREFERENCIAS = "preferencias.json";
export const PADRAO: Preferencias = { nome: null, letra: "normal", tema: "sistema" };

/**
 * As preferências ficam num estado do próprio módulo (e não no React Query), porque o tema e a letra
 * valem para todo componente, inclusive os que aparecem antes do QueryClientProvider e os dos testes.
 */
let atual: Preferencias = PADRAO;
const ouvintes = new Set<() => void>();

function avisar() {
  for (const ouvir of ouvintes) ouvir();
}

/** Lê do aparelho. Sem arquivo, ou com ele estragado, valem as preferências padrão. */
export async function lerPreferencias(): Promise<Preferencias> {
  try {
    const texto = await armazenamento.ler(ARQUIVO_PREFERENCIAS);
    if (!texto) return PADRAO;
    const lido = preferenciasSchema.safeParse(JSON.parse(texto));
    return lido.success ? normalizarNome(lido.data) : PADRAO;
  } catch {
    return PADRAO;
  }
}

/** Uma vez, na abertura do app. */
export async function carregarPreferencias(): Promise<void> {
  atual = await lerPreferencias();
  avisar();
}

function normalizarNome(p: Preferencias): Preferencias {
  const nome = p.nome?.trim() ?? "";
  return { ...p, nome: nome.length > 0 ? nome : null };
}

export async function mudarPreferencias(mudanca: Partial<Preferencias>): Promise<void> {
  atual = normalizarNome({ ...atual, ...mudanca });
  avisar();
  try {
    await armazenamento.gravar(ARQUIVO_PREFERENCIAS, JSON.stringify(atual));
  } catch {
    // Sem espaço no aparelho: a escolha vale até fechar o app.
  }
}

/** Só para os testes: volta ao padrão. */
export function reiniciarPreferencias(): void {
  atual = PADRAO;
  avisar();
}

function inscrever(ouvir: () => void) {
  ouvintes.add(ouvir);
  return () => {
    ouvintes.delete(ouvir);
  };
}

export function usePreferencias(): Preferencias {
  return useSyncExternalStore(inscrever, () => atual, () => atual);
}
