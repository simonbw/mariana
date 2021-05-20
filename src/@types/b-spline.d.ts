declare module "b-spline" {
  export default function bspline(
    x: number,
    degree: number,
    points: [number, number][]
  ): [number, number];
}
