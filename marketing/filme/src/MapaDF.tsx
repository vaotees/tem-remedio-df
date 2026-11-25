import { useMemo } from "react";
import { BufferGeometry, CanvasTexture, ExtrudeGeometry, Shape, SRGBColorSpace, Vector3 } from "three";
import lagoParanoa from "./dados/lago.json";
import mapa from "./dados/mapa.json";
import { COR, LETRA, NIVEL_COR } from "./marca";

/**
 * O Distrito Federal em relevo, com as farmácias de UBS nas coordenadas reais (src/dados/mapa.json, gerado
 * por dados.mjs a partir do snapshot publicado). Cada posto que tem o remédio vira uma cápsula em pé: a altura
 * é a dos dias de estoque (até 60) e a cor é a do semáforo do app. Quem não tem fica só como um ponto.
 *
 * 1 unidade = 2 km. O norte fica para o fundo (-z).
 */
type Posto = (typeof mapa)["postos"][number];

const LAT0 = -15.785;
const LNG0 = -47.81;
const KM_LAT = 111;
const KM_LNG = 107;
const ESCALA = 0.5;
export const projetar = (lat: number, lng: number): [number, number] => [
  (lng - LNG0) * KM_LNG * ESCALA,
  -(lat - LAT0) * KM_LAT * ESCALA,
];

// O DF é quase um retângulo (o "quadrilátero" de 1892). Limites aproximados.
const DF = { norte: -15.5, sul: -16.05, oeste: -48.29, leste: -47.31 };

const ALTURA_BASE = 0.9;
const ALTURA_MAX = 4.2;
const RAIO = 0.46;

function placa() {
  const [x0, z0] = projetar(DF.norte, DF.oeste);
  const [x1, z1] = projetar(DF.sul, DF.leste);
  const r = 2.2;
  const s = new Shape();
  s.moveTo(x0 + r, z0);
  s.lineTo(x1 - r, z0);
  s.quadraticCurveTo(x1, z0, x1, z0 + r);
  s.lineTo(x1, z1 - r);
  s.quadraticCurveTo(x1, z1, x1 - r, z1);
  s.lineTo(x0 + r, z1);
  s.quadraticCurveTo(x0, z1, x0, z1 - r);
  s.lineTo(x0, z0 + r);
  s.quadraticCurveTo(x0, z0, x0 + r, z0);
  return { forma: s, largura: x1 - x0, profundidade: z1 - z0, centro: [(x0 + x1) / 2, (z0 + z1) / 2] as const };
}

/** Um braço do Lago Paranoá: a linha central com a meia largura para cada lado vira o contorno. */
function braco(pontos: number[][]) {
  const pts = pontos.map(([lat, lng, km]) => ({ p: projetar(lat, lng), w: km * 0.5 * ESCALA * 1.6 }));
  const esquerda: Array<[number, number]> = [];
  const direita: Array<[number, number]> = [];
  pts.forEach((q, i) => {
    const a = pts[Math.max(0, i - 1)].p;
    const c = pts[Math.min(pts.length - 1, i + 1)].p;
    let dx = c[0] - a[0];
    let dz = c[1] - a[1];
    const l = Math.hypot(dx, dz);
    dx /= l;
    dz /= l;
    esquerda.push([q.p[0] - dz * q.w, q.p[1] + dx * q.w]);
    direita.push([q.p[0] + dz * q.w, q.p[1] - dx * q.w]);
  });
  const s = new Shape();
  [...esquerda, ...direita.reverse()].forEach(([x, z], i) => (i === 0 ? s.moveTo(x, z) : s.lineTo(x, z)));
  s.closePath();
  return s;
}

/** Grade fina e um brilho no centro, desenhados num canvas (textura do topo da placa). */
function texturaPlaca(largura: number, profundidade: number) {
  const px = 2048;
  const canvas = document.createElement("canvas");
  canvas.width = px;
  canvas.height = Math.round((px * profundidade) / largura);
  const c = canvas.getContext("2d")!;
  const g = c.createRadialGradient(canvas.width * 0.42, canvas.height * 0.5, 40, canvas.width * 0.42, canvas.height * 0.5, canvas.width * 0.7);
  g.addColorStop(0, "#26456a");
  g.addColorStop(1, "#16304d");
  c.fillStyle = g;
  c.fillRect(0, 0, canvas.width, canvas.height);
  c.strokeStyle = "rgba(169,184,200,0.13)";
  c.lineWidth = 2;
  const passo = canvas.width / 48;
  for (let x = 0; x <= canvas.width; x += passo) {
    c.beginPath();
    c.moveTo(x, 0);
    c.lineTo(x, canvas.height);
    c.stroke();
  }
  for (let y = 0; y <= canvas.height; y += passo) {
    c.beginPath();
    c.moveTo(0, y);
    c.lineTo(canvas.width, y);
    c.stroke();
  }
  const t = new CanvasTexture(canvas);
  t.colorSpace = SRGBColorSpace;
  return t;
}

/** Nome de uma região como uma plaquinha que sempre olha para a câmera. */
function Rotulo({ texto, x, z, y = 6.2 }: { texto: string; x: number; z: number; y?: number }) {
  const { textura, proporcao } = useMemo(() => {
    const canvas = document.createElement("canvas");
    const c = canvas.getContext("2d")!;
    const fonte = `700 64px ${LETRA}`;
    c.font = fonte;
    const largura = Math.ceil(c.measureText(texto).width) + 64;
    canvas.width = largura;
    canvas.height = 104;
    c.font = fonte;
    c.fillStyle = "rgba(11,26,43,0.78)";
    c.beginPath();
    c.roundRect(0, 0, largura, 104, 52);
    c.fill();
    c.fillStyle = COR.papel;
    c.textBaseline = "middle";
    c.fillText(texto, 32, 56);
    const textura = new CanvasTexture(canvas);
    textura.colorSpace = SRGBColorSpace;
    return { textura, proporcao: largura / 104 };
  }, [texto]);
  const altura = 2.1;
  return (
    <sprite position={[x, y, z]} scale={[altura * proporcao, altura, 1]}>
      <spriteMaterial map={textura} depthTest={false} transparent />
    </sprite>
  );
}

function centroDaRegiao(ra: string): [number, number] {
  const da = mapa.postos.filter((p) => p.ra === ra);
  const lat = da.reduce((s, p) => s + p.lat, 0) / da.length;
  const lng = da.reduce((s, p) => s + p.lng, 0) / da.length;
  return projetar(lat, lng);
}

export type RotuloRegiao = { ra: string; dx?: number; dz?: number };

type Props = {
  /** 0..1: quanto as cápsulas já subiram (no filme, elas sobem em onda, do mais perto para o mais longe). */
  subida?: (p: Posto, i: number) => number;
  rotulos?: RotuloRegiao[];
  destaque?: string;
};

export function MapaDF({ subida = () => 1, rotulos = [], destaque }: Props) {
  const { forma, largura, profundidade } = useMemo(placa, []);
  const geometriaPlaca = useMemo(
    () => new ExtrudeGeometry(forma, { depth: 1.4, bevelEnabled: true, bevelThickness: 0.25, bevelSize: 0.25, bevelSegments: 4 }),
    [forma],
  );
  const geometriasLago = useMemo(() => lagoParanoa.bracos.map((b) => new ExtrudeGeometry(braco(b), { depth: 0.2, bevelEnabled: false, curveSegments: 12 })), []);
  const textura = useMemo(() => {
    const t = texturaPlaca(largura, profundidade);
    const [x0, z0] = projetar(DF.norte, DF.oeste);
    t.repeat.set(1 / largura, 1 / profundidade);
    t.offset.set(-x0 / largura, -z0 / profundidade);
    return t;
  }, [largura, profundidade]);
  const contorno = useMemo(() => new BufferGeometry().setFromPoints(forma.getPoints(12).map((v) => new Vector3(v.x, 0.05, v.y))), [forma]);

  return (
    <group>
      {/* A placa do DF: a forma está no plano XY; girada para deitar no chão (topo em y = 0). */}
      <mesh geometry={geometriaPlaca} rotation={[Math.PI / 2, 0, 0]} position={[0, -0.26, 0]} receiveShadow>
        <meshStandardMaterial attach="material-0" map={textura} roughness={0.85} />
        <meshStandardMaterial attach="material-1" color="#0d1d30" roughness={0.9} />
      </mesh>
      <lineLoop geometry={contorno}>
        <lineBasicMaterial color={COR.azulClaro} transparent opacity={0.7} />
      </lineLoop>
      {geometriasLago.map((g, i) => (
        <mesh key={i} geometry={g} rotation={[Math.PI / 2, 0, 0]} position={[0, 0.03, 0]} receiveShadow>
          <meshPhysicalMaterial color="#2f86d6" emissive="#1d5f9e" emissiveIntensity={0.35} roughness={0.1} clearcoat={1} clearcoatRoughness={0.05} />
        </mesh>
      ))}

      {mapa.postos.map((p, i) => {
        const [x, z] = projetar(p.lat, p.lng);
        if (!p.tem || !p.nivel) {
          return (
            <mesh key={i} position={[x, 0.06, z]} rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[0.3, 24]} />
              <meshBasicMaterial color="#7c8ea3" />
            </mesh>
          );
        }
        const dias = p.dias === null ? 30 : Math.min(60, p.dias);
        const alturaFinal = ALTURA_BASE + (dias / 60) * (ALTURA_MAX - ALTURA_BASE);
        const s = Math.max(0, Math.min(1, subida(p, i)));
        if (s <= 0.001) return null;
        const altura = Math.max(RAIO * 2.2, alturaFinal * s);
        const cor = NIVEL_COR[p.nivel as keyof typeof NIVEL_COR];
        const ehDestaque = destaque !== undefined && p.nome === destaque;
        return (
          <group key={i} position={[x, 0, z]}>
            <mesh position={[0, altura / 2, 0]} castShadow>
              <capsuleGeometry args={[RAIO, Math.max(0.001, altura - RAIO * 2), 8, 20]} />
              <meshPhysicalMaterial color={cor} emissive={cor} emissiveIntensity={0.1} roughness={0.38} clearcoat={0.6} clearcoatRoughness={0.3} />
            </mesh>
            {ehDestaque ? (
              <mesh position={[0, 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.75, 1.0, 48]} />
                <meshBasicMaterial color={COR.menta} />
              </mesh>
            ) : null}
          </group>
        );
      })}

      {rotulos.map(({ ra, dx = 0, dz = 0 }) => {
        const [x, z] = centroDaRegiao(ra);
        return <Rotulo key={ra} texto={ra} x={x + dx} z={z + dz} />;
      })}
    </group>
  );
}

export const RESUMO = { total: mapa.total, comEstoque: mapa.comEstoque, contagem: mapa.contagem, atualizadoEm: mapa.atualizadoEm, produto: mapa.produto };
