import type { ConfigContext, ExpoConfig } from "expo/config";

/**
 * A configuração fica no `app.json`. Aqui só entra o caminho do site na exportação da versão web
 * para o GitHub Pages (`TEM_REMEDIO_BASE_URL=/tem-remedio-df/app`, no workflow que publica o site).
 * No celular, no build do EAS e no servidor de desenvolvimento, o app fica na raiz.
 */
export default ({ config }: ConfigContext): ExpoConfig => {
  const baseUrl = process.env.TEM_REMEDIO_BASE_URL;
  if (!baseUrl) return config as ExpoConfig;
  return { ...config, experiments: { ...config.experiments, baseUrl } } as ExpoConfig;
};
