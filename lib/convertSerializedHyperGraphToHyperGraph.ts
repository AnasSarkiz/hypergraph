import type {
  GraphEdge,
  GraphEdgeId,
  GraphPoint,
  GraphPointId,
  GraphRegion,
  GraphRegionId,
  HyperGraph,
  SerializedHyperGraph,
} from "./types"

export const convertSerializedHyperGraphToHyperGraph = (
  serializedHyperGraph: SerializedHyperGraph | HyperGraph,
): HyperGraph => {
  const edgeMap = new Map<GraphEdgeId, GraphEdge>()
  const pointMap = new Map<GraphPointId, GraphPoint>()
  const regionMap = new Map<GraphRegionId, GraphRegion>()

  for (const edge of serializedHyperGraph.edges) {
    edgeMap.set(edge.edgeId, { ...edge })
  }

  for (const point of serializedHyperGraph.points) {
    if ("edges" in point) {
      pointMap.set(point.pointId, {
        ...point,
        edges: point.edges,
      })
    } else {
      pointMap.set(point.pointId, {
        ...point,
        edges: point.edgeIds.map((edgeId) => edgeMap.get(edgeId)!),
      })
    }
  }

  for (const region of serializedHyperGraph.regions) {
    if ("points" in region) {
      regionMap.set(region.regionId, {
        ...region,
        points: region.points,
      })
    } else {
      regionMap.set(region.regionId, {
        ...region,
        points: region.pointIds.map((pointId) => pointMap.get(pointId)!),
      })
    }
  }

  return {
    edges: Array.from(edgeMap.values()),
    points: Array.from(pointMap.values()),
    regions: Array.from(regionMap.values()),
  }
}
