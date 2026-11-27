import { useThree } from "@react-three/fiber";
import { useLayoutEffect } from "react";
import { PMREMGenerator } from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

/**
 * Reflexos de estúdio gerados no próprio Three.js (sem baixar HDRI): dão o brilho de verniz nas cápsulas.
 * Mesma receita do filme da Plano Alto (marketing/filme-3d do projeto Drone).
 */
export function Reflexos({ intensidade = 0.7 }: { intensidade?: number }) {
  const { gl, scene } = useThree();
  useLayoutEffect(() => {
    const pmrem = new PMREMGenerator(gl);
    const ambiente = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = ambiente;
    scene.environmentIntensity = intensidade;
    return () => {
      ambiente.dispose();
      pmrem.dispose();
    };
  }, [gl, scene, intensidade]);
  return null;
}

/** Posiciona a câmera e aponta para o alvo a cada quadro (o Remotion desenha um quadro por vez). */
export function Camera({ posicao, alvo, fov }: { posicao: [number, number, number]; alvo: [number, number, number]; fov?: number }) {
  const { camera } = useThree();
  useLayoutEffect(() => {
    camera.position.set(...posicao);
    camera.lookAt(...alvo);
    if (fov && "fov" in camera) camera.fov = fov;
    camera.updateProjectionMatrix();
  }, [camera, posicao, alvo, fov]);
  return null;
}
