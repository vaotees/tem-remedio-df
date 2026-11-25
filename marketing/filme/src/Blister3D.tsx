/**
 * Cartela de comprimidos em 3D (2 × 5), com cúpulas transparentes e uma cápsula em cada uma. A cena do problema
 * esvazia a cartela: `cheia(i)` diz quanto da cápsula `i` ainda está ali (1 = inteira, 0 = sumiu).
 */
export function Blister3D({ cheia = () => 1, ...grupo }: {
  cheia?: (i: number) => number;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
}) {
  const cavidades = Array.from({ length: 10 }, (_, i) => ({ i, x: -2.0 + (i % 5) * 1.0, z: -0.55 + Math.floor(i / 5) * 1.1 }));
  return (
    <group {...grupo}>
      {/* A lâmina de alumínio. */}
      <mesh receiveShadow castShadow>
        <boxGeometry args={[5.4, 0.1, 2.5]} />
        <meshStandardMaterial color="#c9d3dd" metalness={0.85} roughness={0.32} />
      </mesh>
      {cavidades.map(({ i, x, z }) => {
        const s = Math.max(0, Math.min(1, cheia(i)));
        return (
          <group key={i} position={[x, 0.05, z]}>
            {/* Cúpula de plástico. */}
            <mesh scale={[1, 0.62, 1]}>
              <sphereGeometry args={[0.42, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2]} />
              <meshPhysicalMaterial color="#ffffff" transparent opacity={0.22} roughness={0.04} clearcoat={1} clearcoatRoughness={0.02} depthWrite={false} />
            </mesh>
            {s > 0.001 ? (
              <group position={[0, 0.13, 0]} rotation={[0, 0.35, Math.PI / 2]} scale={s}>
                <mesh position={[0, 0.1, 0]} castShadow>
                  <capsuleGeometry args={[0.13, 0.2, 8, 20]} />
                  <meshPhysicalMaterial color="#6CB4F5" roughness={0.3} clearcoat={1} />
                </mesh>
                <mesh position={[0, -0.1, 0]} castShadow>
                  <capsuleGeometry args={[0.13, 0.2, 8, 20]} />
                  <meshPhysicalMaterial color="#F2F6FA" roughness={0.3} clearcoat={1} />
                </mesh>
              </group>
            ) : null}
          </group>
        );
      })}
    </group>
  );
}
