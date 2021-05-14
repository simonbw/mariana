import { makeNoise2D } from "fast-simplex-noise";

const simplex2D = makeNoise2D();
// Just a random number.  Since we only have 2d noise generator, when we want 1d, we will use this value for y.
const simplex1DY = 0.703403429520975;

// Turbulence will add multiple octaves with different amplitudes/wavelengths so you get small and big bumps.
type TurbulenceParameters = {
  // The number of signals we will be summing
  octaves: number;
  // Scales height of noise
  amplitude: number;
  // Scales width of noise
  wavelength: number;
  // Scales amplitude each octave.
  peristence: number;
  // Scales wavelength each octave
  lacunarity: number;
};

function turbulence2D(p: TurbulenceParameters, x: number, y: number): number {
  let sum = 0;
  let a = p.amplitude;
  let w = p.wavelength;
  for (let i = 0; i < p.octaves; i++) {
    sum += a * simplex2D(x / w, y / w);
    a *= p.peristence;
    w *= p.lacunarity;
  }
  return sum;
}

export function makeTurbulence1D(
  p: TurbulenceParameters
): (x: number) => number {
  return (x: number) => turbulence2D(p, x, simplex1DY);
}

export function makeTurbulence2D(
  p: TurbulenceParameters
): (x: number, y: number) => number {
  return (x: number, y: number) => turbulence2D(p, x, y);
}
