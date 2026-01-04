import type { GraphicsObject } from "graphics-debug"
import type { JumperGraph } from "./jumper-types"

export const visualizeJumperGraph = (graph: JumperGraph): GraphicsObject => {
  const graphics = {
    arrows: [],
    circles: [],
    title: "Jumper Graph",
    lines: [],
    points: [],
    rects: [],
    texts: [],
    coordinateSystem: "cartesian",
  } as Required<GraphicsObject>

  // TODO

  return graphics
}
