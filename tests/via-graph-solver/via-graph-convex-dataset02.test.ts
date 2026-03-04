import { expect, test } from "bun:test"
import viaTile from "assets/ViaGraphSolver/via-tile-4-regions.json"
import { getSvgFromGraphicsObject } from "graphics-debug"
import type { XYConnection } from "lib/JumperGraphSolver/jumper-graph-generator/createGraphWithConnectionsFromBaseGraph"
import { ViaGraphSolver } from "lib/ViaGraphSolver/ViaGraphSolver"
import { createConvexViaGraphFromXYConnections } from "lib/ViaGraphSolver/via-graph-generator/createConvexViaGraphFromXYConnections"
import { createConvexViaGraphFromWidthHeight } from "lib/ViaGraphSolver/via-graph-generator/createConvexViaGraphFromWidthHeight"
import { insertXYConnectionsIntoConvexViaGraph } from "lib/ViaGraphSolver/via-graph-generator/insertXYConnectionsIntoConvexViaGraph"
import dataset02 from "../../datasets/jumper-graph-solver/dataset02.json"

interface DatasetSample {
  config: {
    numCrossings: number
    seed: number
    rows: number
    cols: number
    orientation: "vertical" | "horizontal"
  }
  connections: {
    connectionId: string
    startRegionId: string
    endRegionId: string
  }[]
  connectionRegions: {
    regionId: string
    pointIds: string[]
    d: {
      bounds: { minX: number; maxX: number; minY: number; maxY: number }
      center: { x: number; y: number }
      isPad: boolean
      isConnectionRegion: boolean
    }
  }[]
}

const typedDataset = dataset02 as DatasetSample[]

const extractXYConnections = (sample: DatasetSample): XYConnection[] => {
  const regionMap = new Map(
    sample.connectionRegions.map((r) => [r.regionId, r.d.center]),
  )

  return sample.connections.map((conn) => {
    const start = regionMap.get(conn.startRegionId)
    const end = regionMap.get(conn.endRegionId)

    if (!start || !end) {
      throw new Error(
        `Missing region for connection ${conn.connectionId}: start=${conn.startRegionId}, end=${conn.endRegionId}`,
      )
    }

    return {
      connectionId: conn.connectionId,
      start,
      end,
    }
  })
}

const calculateBounds = (xyConnections: XYConnection[]) => {
  return xyConnections.reduce(
    (bounds, connection) => ({
      minX: Math.min(bounds.minX, connection.start.x, connection.end.x),
      maxX: Math.max(bounds.maxX, connection.start.x, connection.end.x),
      minY: Math.min(bounds.minY, connection.start.y, connection.end.y),
      maxY: Math.max(bounds.maxY, connection.start.y, connection.end.y),
    }),
    {
      minX: Number.POSITIVE_INFINITY,
      maxX: Number.NEGATIVE_INFINITY,
      minY: Number.POSITIVE_INFINITY,
      maxY: Number.NEGATIVE_INFINITY,
    },
  )
}

test("via-graph-convex-dataset02: split helpers compose back to the existing API", () => {
  const sample = typedDataset[0]
  const xyConnections = extractXYConnections(sample)
  const bounds = calculateBounds(xyConnections)

  const combinedGraph = createConvexViaGraphFromXYConnections(
    xyConnections,
    viaTile,
  )
  const baseGraph = createConvexViaGraphFromWidthHeight(
    bounds.maxX - bounds.minX,
    bounds.maxY - bounds.minY,
    viaTile,
    {
      minX: bounds.minX,
      minY: bounds.minY,
    },
  )
  const splitGraph = insertXYConnectionsIntoConvexViaGraph(
    baseGraph,
    xyConnections,
  )

  expect(baseGraph).not.toHaveProperty("connections")
  expect(splitGraph.tileCount).toEqual(combinedGraph.tileCount)
  expect(splitGraph.regions.map((region) => region.regionId)).toEqual(
    combinedGraph.regions.map((region) => region.regionId),
  )
  expect(splitGraph.ports.map((port) => port.portId)).toEqual(
    combinedGraph.ports.map((port) => port.portId),
  )
  expect(
    splitGraph.connections.map((connection) => ({
      connectionId: connection.connectionId,
      startRegionId: connection.startRegion.regionId,
      endRegionId: connection.endRegion.regionId,
    })),
  ).toEqual(
    combinedGraph.connections.map((connection) => ({
      connectionId: connection.connectionId,
      startRegionId: connection.startRegion.regionId,
      endRegionId: connection.endRegion.regionId,
    })),
  )
}, 30000)

test("via-graph-convex-dataset02: solve sample 0 with convex regions", () => {
  const sample = typedDataset[0]
  const xyConnections = extractXYConnections(sample)

  const result = createConvexViaGraphFromXYConnections(xyConnections, viaTile)

  // Verify tiling occurred
  expect(result.tileCount.rows).toBeGreaterThanOrEqual(0)
  expect(result.tileCount.cols).toBeGreaterThanOrEqual(0)

  // Verify we have convex regions (regionId contains ":convex:" or starts with "filler:")
  const convexRegions = result.regions.filter(
    (r) => r.regionId.includes(":convex:") || r.regionId.startsWith("filler:"),
  )
  expect(convexRegions.length).toBeGreaterThan(0)

  // Verify we have via regions with at least one port
  const viaRegions = result.regions.filter((r) => r.d.isViaRegion)
  expect(viaRegions.length).toBeGreaterThan(0)
  for (const viaRegion of viaRegions) {
    expect(viaRegion.ports.length).toBeGreaterThanOrEqual(1)
  }

  const solver = new ViaGraphSolver({
    inputGraph: {
      regions: result.regions,
      ports: result.ports,
    },
    inputConnections: result.connections,
    viaTile: result.viaTile,
  })

  solver.solve()

  expect(solver.solved).toBe(true)

  expect(getSvgFromGraphicsObject(solver.visualize())).toMatchSvgSnapshot(
    import.meta.path,
  )
}, 30000)
