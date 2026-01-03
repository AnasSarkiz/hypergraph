import { BaseSolver } from "@tscircuit/solver-utils"
import { convertSerializedHyperGraphToHyperGraph } from "./convertSerializedHyperGraphToHyperGraph"
import type { HyperGraph, SerializedHyperGraph } from "./types"

export class HyperGraphSolver extends BaseSolver {
  constructor(
    public input: {
      graph: HyperGraph | SerializedHyperGraph
      connections: Connection[]
    },
  ) {
    super()
  }
}
