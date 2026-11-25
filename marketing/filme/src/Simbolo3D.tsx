import { useMemo } from "react";
import { Quaternion, Vector3 } from "three";
import { COR } from "./marca";

/**
 * O símbolo da marca em 3D: um visto feito de cápsula. Os pontos vêm do desenho em SVG
 * (apps/mobile/assets/marca, 1024 × 1024, raio 84): a haste curta vai de A a B, a cápsula longa de B a C,
 * dividida em duas metades (azul embaixo, menta em cima) com um vão entre elas.
 */
const ESCALA = 1 / 100;
const ponto = (x: number, y: number) => new Vector3((x - 512) * ESCALA, -(y - 512) * ESCALA, 0);
const A = ponto(266.9, 559.85);
const B = ponto(447.7, 711.55);
const C = ponto(769.05, 328.5);
const RAIO = 84 * ESCALA;
const VAO = 0.2;

type Props = {
  /** 0 = metades separadas, 1 = encaixadas (o "clique" do filme). */
  encaixe?: number;
  corHaste?: string;
  corBaixo?: string;
  corCima?: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
};

/** Cilindro de `de` até `ate`, com meia esfera só na ponta de `ate` (a ponta de `de` fica reta, no vão). */
function MeiaCapsula({ de, ate, cor, pontaNoInicio = false }: { de: Vector3; ate: Vector3; cor: string; pontaNoInicio?: boolean }) {
  const { meio, giro, comprimento } = useMemo(() => {
    const dir = new Vector3().subVectors(ate, de);
    const comprimento = dir.length();
    const giro = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), dir.clone().normalize());
    return { meio: new Vector3().addVectors(de, ate).multiplyScalar(0.5), giro, comprimento };
  }, [de, ate]);
  const material = <meshPhysicalMaterial color={cor} roughness={0.28} clearcoat={1} clearcoatRoughness={0.18} metalness={0} />;
  return (
    <group position={meio} quaternion={giro}>
      <mesh castShadow>
        <cylinderGeometry args={[RAIO, RAIO, comprimento, 64, 1]} />
        {material}
      </mesh>
      <mesh position={[0, comprimento / 2, 0]} castShadow>
        <sphereGeometry args={[RAIO, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2]} />
        {material}
      </mesh>
      {pontaNoInicio ? (
        <mesh position={[0, -comprimento / 2, 0]} rotation={[Math.PI, 0, 0]} castShadow>
          <sphereGeometry args={[RAIO, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2]} />
          {material}
        </mesh>
      ) : null}
    </group>
  );
}

export function Simbolo3D({ encaixe = 1, corHaste = COR.azulClaro, corBaixo = COR.azulClaro, corCima = COR.menta, ...grupo }: Props) {
  const dir = useMemo(() => new Vector3().subVectors(C, B).normalize(), []);
  const meio = useMemo(() => new Vector3().addVectors(B, C).multiplyScalar(0.5), []);
  // As metades se afastam ao longo da cápsula quando ainda não encaixaram.
  const afasta = (1 - encaixe) * 1.4;
  const baixoAte = meio.clone().addScaledVector(dir, -VAO / 2 - afasta);
  const cimaDe = meio.clone().addScaledVector(dir, VAO / 2 + afasta);
  const baixoDe = B.clone().addScaledVector(dir, -afasta);
  const cimaAte = C.clone().addScaledVector(dir, afasta);
  return (
    <group {...grupo}>
      {/* A haste curta fica um pouco atrás: no desenho, um contorno a separa da cápsula longa. */}
      <group position={[0, 0, -0.35]}>
        <MeiaCapsula de={B} ate={A} cor={corHaste} pontaNoInicio />
      </group>
      <MeiaCapsula de={baixoAte} ate={baixoDe} cor={corBaixo} />
      <MeiaCapsula de={cimaDe} ate={cimaAte} cor={corCima} />
    </group>
  );
}
