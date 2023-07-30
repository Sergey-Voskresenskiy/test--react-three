import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

import { extend } from "@react-three/fiber";
import { shaderMaterial } from "@react-three/drei";

import { data } from "./data";

import { Tubes } from "./BrainTubes";
import { useEffect, useMemo, useRef } from "react";

const randomRange = (min, max) => Math.random() * (max - min) + min;

const brainCurves = [];
data.economics[0].paths.forEach((path) => {
  const points = [];
  for (let i = 0; i < path.length; i += 3) {
    points.push(new THREE.Vector3(path[i], path[i + 1], path[i + 2]));
  }

  const tempCurve = new THREE.CatmullRomCurve3(points);
  brainCurves.push(tempCurve);
});

function BrainParticls({ allTheCurves }) {
  const density = 10;
  const numbersOfPoints = density * allTheCurves.length;

  const myPoints = useRef([]);
  const brainGeo = useRef(null);

  const positions = useMemo(() => {
    const positions = [];
    for (let i = 0; i < numbersOfPoints; i++) {
      positions.push(
        randomRange(-1, 1),
        randomRange(-1, 1),
        randomRange(-1, 1)
      );
    }
    return new Float32Array(positions);
  }, [numbersOfPoints]);

  const randomsSize = useMemo(() => {
    const randomsSize = [];
    for (let i = 0; i < numbersOfPoints; i++) {
      randomsSize.push(randomRange(0.3, 0.7));
    }
    return new Float32Array(randomsSize);
  }, [numbersOfPoints]);

  useEffect(() => {
    for (let i = 0; i < allTheCurves.length; i++) {
      for (let j = 0; j < density; j++) {
        myPoints.current.push({
          currentOffset: Math.random(),
          speed: Math.random() * 0.01,
          curve: allTheCurves[i],
          curPosition: Math.random(),
        });
      }
    }
  });

  useFrame(() => {
    const currentPosition = brainGeo.current.attributes.position.array;

    for (let i = 0; i < myPoints.current.length; i++) {
      myPoints.current[i].curPosition += myPoints.current[i].speed;
      myPoints.current[i].curPosition = myPoints.current[i].curPosition % 1;

      const curPoint = myPoints.current[i].curve.getPointAt(
        myPoints.current[i].curPosition
      );

      currentPosition[i * 3] = curPoint.x;
      currentPosition[i * 3 + 1] = curPoint.y;
      currentPosition[i * 3 + 2] = curPoint.z;
    }

    brainGeo.current.attributes.position.needsUpdate = true;
  });

  const BrainParticleMaterial = shaderMaterial(
    {
      time: 0,
      color: new THREE.Color(`#F3AA60`),
      color2: new THREE.Color(`#1D5B79`),
    },
    // vertex shader
    /*glsl*/ `
    varying vec2 vUv;
    uniform float time;
    varying float vProgress;
    attribute float random;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.);
      gl_PointSize = random*2. *(1./-mvPosition.z);
    }
  `,
    // fragment shader
    /*glsl*/ `
    uniform float time;
    void main() {
      float disc = length(gl_PointCoord.xy - vec2(0.5));
      float opacity = 0.3*smoothstep(0.5,0.4,disc);
      
      gl_FragColor.rgba = vec4(vec3(opacity),1.);
    }
  `
  );

  // declaratively
  extend({ BrainParticleMaterial });

  return (
    <>
      <points>
        <bufferGeometry attach="geometry" ref={brainGeo}>
          <bufferAttribute
            attach="attributes-position"
            count={positions.length / 3}
            array={positions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-random"
            count={randomsSize.length}
            array={randomsSize}
            itemSize={1}
          />
        </bufferGeometry>
        <brainParticleMaterial
          attach="material"
          transparent={true}
          depthTest={false}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </>
  );
}

export default function App() {
  return (
    <Canvas camera={{ position: [0, 0, 0.3], near: 0.001, far: 5 }}>
      <color attach="background" args={["#0f151c"]} />
      <ambientLight />
      <pointLight position={[10, 10, 10]} />

      <Tubes allTheCurves={brainCurves} />
      <BrainParticls allTheCurves={brainCurves} />
      <OrbitControls />
    </Canvas>
  );
}
