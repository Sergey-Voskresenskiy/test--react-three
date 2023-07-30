import * as THREE from "three";
import { Canvas, extend, useFrame } from "@react-three/fiber";
import { OrbitControls, shaderMaterial } from "@react-three/drei";
import { useRef } from "react";
import { data } from "./data";

const brainCurves = [];
data.economics[0].paths.forEach((path) => {
  const points = [];
  for (let i = 0; i < path.length; i += 3) {
    points.push(new THREE.Vector3(path[i], path[i + 1], path[i + 2]));
  }

  const tempCurve = new THREE.CatmullRomCurve3(points);
  brainCurves.push(tempCurve);
});

function Tube({ curve }) {
  const brainMat = useRef();

  useFrame(({ clock }) => {
    brainMat.current.uniforms.time.value = clock.getElapsedTime();
  });

  const BrainMaterial = shaderMaterial(
    {
      time: 0,
      color: new THREE.Color(1, 0.2, 0),
      color2: new THREE.Color(0.1, 0.2, 1.0),
    },
    // vProgress = abs(sin(vUv.x*4. + time));
    // vertex shader
    /*glsl*/ `
    varying vec2 vUv;
    uniform float time;
    varying float vProgress;
    void main() {
      vUv = uv;
      vProgress = smoothstep(-1.,1.,sin(vUv.x*8. + time));
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
    // fragment shader
    /*glsl*/ `
    uniform float time;
    uniform vec3 color;
    uniform vec3 color2;
    varying vec2 vUv;
    varying float vProgress;
    void main() {
      vec3 finalColor = mix(color, color2, vProgress);
      gl_FragColor.rgba = vec4(finalColor,1.);
    }
  `
  );

  // declaratively
  extend({ BrainMaterial });

  return (
    <>
      <mesh>
        <tubeGeometry args={[curve, 64, 0.001, 2, false]} />
        <brainMaterial
          ref={brainMat}
          side={THREE.DoubleSide}
          transparent={true}
          depthTest={false}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          wireframe={true}
        />
      </mesh>
    </>
  );
}

function Tubes({ allthecurve }) {
  return (
    <>
      {allthecurve.map((curve, index) => (
        <Tube curve={curve} key={index} />
      ))}
    </>
  );
}

export default function App() {
  return (
    <Canvas camera={{ position: [0, 0, 0.3], near: 0.001, far: 5 }}>
      <color attach="background" args={["black"]} />
      <ambientLight />
      <pointLight position={[10, 10, 10]} />

      <Tubes allthecurve={brainCurves} />

      <OrbitControls />
    </Canvas>
  );
}
