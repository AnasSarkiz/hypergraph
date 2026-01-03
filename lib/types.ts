export type GraphPointId = string
export type GraphEdgeId = string
export type GraphRegionId = string
export type ConnectionId = string

export type GraphEdge = {
  edgeId: GraphEdgeId
  fromPointId: GraphPointId
  toPointId: GraphPointId
}

export type GraphPoint = {
  pointId: GraphPointId
  edges: GraphEdge[]
  d: any
}

export type GraphRegion = {
  regionId: GraphRegionId
  points: GraphPoint[]
  d: any
}

export type Candidate = {
  point: GraphPoint
  g: number
  h: number
  f: number
  hops: number
  parent?: Candidate
  lastPoint?: GraphPoint
  lastEdge?: GraphEdge
  lastRegion?: GraphRegion
  nextRegion?: GraphRegion
}

export type HyperGraph = {
  edges: GraphEdge[]
  points: GraphPoint[]
  regions: GraphRegion[]
}

export type SerializedGraphEdge = GraphEdge
export type SerializedGraphPoint = Omit<GraphPoint, "edges"> & {
  edgeIds: GraphEdgeId[]
}
export type SerializedGraphRegion = Omit<GraphRegion, "points"> & {
  pointIds: GraphPointId[]
}
export type SerializedHyperGraph = {
  edges: SerializedGraphEdge[]
  points: SerializedGraphPoint[]
  regions: SerializedGraphRegion[]
}

export type Connection = {
  connectionId: ConnectionId
  startPoint: GraphPoint
  endPoint: GraphPoint
}

export type SerializedConnection = {
  connectionId: ConnectionId
  startPointId: GraphPointId
  endPointId: GraphPointId
}
