import type { XYConnection } from "../../JumperGraphSolver/jumper-graph-generator/createGraphWithConnectionsFromBaseGraph"
import type {
  JPort,
  JRegion,
  JumperGraph,
} from "../../JumperGraphSolver/jumper-types"
import type { Connection } from "../../types"
import { createViaGraphWithConnections } from "./createViaGraphWithConnections"
import type { ConvexViaGraphResult } from "./createConvexViaGraphFromWidthHeight"

export type ConvexViaGraphFromXYConnectionsResult = ConvexViaGraphResult & {
  connections: Connection[]
}

function cloneGraph(baseGraph: JumperGraph): JumperGraph {
  const regionMap = new Map<string, JRegion>()

  for (const region of baseGraph.regions) {
    regionMap.set(region.regionId, {
      ...region,
      ports: [],
    })
  }

  const ports: JPort[] = baseGraph.ports.map((port) => {
    const region1 = regionMap.get(port.region1.regionId)
    const region2 = regionMap.get(port.region2.regionId)

    if (!region1 || !region2) {
      throw new Error(`Missing region while cloning port ${port.portId}`)
    }

    const clonedPort: JPort = {
      ...port,
      region1,
      region2,
      d: { ...port.d },
    }

    region1.ports.push(clonedPort)
    region2.ports.push(clonedPort)

    return clonedPort
  })

  return {
    ...baseGraph,
    regions: Array.from(regionMap.values()),
    ports,
  }
}

export function insertXYConnectionsIntoConvexViaGraph(
  baseGraph: ConvexViaGraphResult,
  xyConnections: XYConnection[],
): ConvexViaGraphFromXYConnectionsResult {
  const clonedBaseGraph = cloneGraph(baseGraph)
  const graphWithConnections = createViaGraphWithConnections(
    clonedBaseGraph,
    xyConnections,
  )

  return {
    ...graphWithConnections,
    viaTile: baseGraph.viaTile,
    tileCount: baseGraph.tileCount,
  }
}
