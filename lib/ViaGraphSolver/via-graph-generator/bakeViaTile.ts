import type { JPort, JRegion } from "../../JumperGraphSolver/jumper-types"
import type { ViaTile } from "../ViaGraphSolver"
import { generateConvexViaTopologyRegions } from "./generateConvexViaTopologyRegions"

type Point = { x: number; y: number }
type Bounds = { minX: number; maxX: number; minY: number; maxY: number }

export type BakedViaTileRegion = {
  regionId: string
  polygon: Point[]
  bounds: Bounds
  center: Point
  isViaRegion: boolean
  netName?: string
}

export type BakedViaTilePort = {
  portId: string
  region1Id: string
  region2Id: string
  position: Point
}

export type BakedViaTile = ViaTile & {
  regions: BakedViaTileRegion[]
  insidePorts: BakedViaTilePort[]
}

const parseViaNetName = (regionId: string): string | undefined => {
  const marker = ":v:"
  const markerIndex = regionId.lastIndexOf(marker)
  if (markerIndex === -1) return undefined
  return regionId.slice(markerIndex + marker.length)
}

const serializeRegion = (region: JRegion): BakedViaTileRegion => ({
  regionId: region.regionId,
  polygon: region.d.polygon ?? [],
  bounds: {
    minX: region.d.bounds.minX,
    maxX: region.d.bounds.maxX,
    minY: region.d.bounds.minY,
    maxY: region.d.bounds.maxY,
  },
  center: { x: region.d.center.x, y: region.d.center.y },
  isViaRegion: Boolean(region.d.isViaRegion),
  netName: parseViaNetName(region.regionId),
})

const serializePort = (port: JPort): BakedViaTilePort => ({
  portId: port.portId,
  region1Id: port.region1.regionId,
  region2Id: port.region2.regionId,
  position: { x: port.d.x, y: port.d.y },
})

/**
 * Bake a single via tile into convex regions and internal ports.
 * This runs the convex topology generator on exactly one tile footprint.
 */
export const bakeViaTile = (
  viaTile: ViaTile,
  opts?: {
    tileWidth?: number
    tileHeight?: number
    portPitch?: number
    clearance?: number
    concavityTolerance?: number
  },
): BakedViaTile => {
  const tileWidth = opts?.tileWidth ?? viaTile.tileWidth
  const tileHeight = opts?.tileHeight ?? viaTile.tileHeight

  if (tileWidth === undefined || tileHeight === undefined) {
    throw new Error(
      "Cannot bake via tile without tileWidth and tileHeight (in input or opts).",
    )
  }

  const bounds = {
    minX: -tileWidth / 2,
    maxX: tileWidth / 2,
    minY: -tileHeight / 2,
    maxY: tileHeight / 2,
  }

  const { regions, ports } = generateConvexViaTopologyRegions({
    viaTile,
    bounds,
    tileWidth,
    tileHeight,
    portPitch: opts?.portPitch,
    clearance: opts?.clearance,
    concavityTolerance: opts?.concavityTolerance,
  })

  const insideRegions = regions.filter(
    (region) => !region.regionId.startsWith("filler:"),
  )
  const insideRegionIds = new Set(
    insideRegions.map((region) => region.regionId),
  )
  const insidePorts = ports.filter(
    (port) =>
      insideRegionIds.has(port.region1.regionId) &&
      insideRegionIds.has(port.region2.regionId),
  )

  return {
    ...viaTile,
    tileWidth,
    tileHeight,
    regions: insideRegions.map(serializeRegion),
    insidePorts: insidePorts.map(serializePort),
  }
}
