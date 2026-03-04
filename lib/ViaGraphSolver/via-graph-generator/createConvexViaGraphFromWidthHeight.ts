import defaultViaTile from "assets/ViaGraphSolver/via-tile-4-regions.json"
import type { JumperGraph } from "../../JumperGraphSolver/jumper-types"
import type { ViaTile } from "../ViaGraphSolver"
import { generateConvexViaTopologyRegions } from "./generateConvexViaTopologyRegions"

export type ConvexViaGraphResult = JumperGraph & {
  viaTile: ViaTile
  tileCount: { rows: number; cols: number }
}

export type CreateConvexViaGraphFromWidthHeightOptions = {
  minX?: number
  minY?: number
  tileWidth?: number
  tileHeight?: number
  tileSize?: number
  portPitch?: number
  clearance?: number
  concavityTolerance?: number
}

export function createConvexViaGraphFromWidthHeight(
  width: number,
  height: number,
  viaTile: ViaTile = defaultViaTile as ViaTile,
  opts?: CreateConvexViaGraphFromWidthHeightOptions,
): ConvexViaGraphResult {
  const minX = opts?.minX ?? 0
  const minY = opts?.minY ?? 0

  const {
    regions,
    ports,
    viaTile: generatedViaTile,
    tileCount,
  } = generateConvexViaTopologyRegions({
    viaTile,
    bounds: {
      minX,
      maxX: minX + width,
      minY,
      maxY: minY + height,
    },
    tileWidth: opts?.tileWidth ?? viaTile.tileWidth,
    tileHeight: opts?.tileHeight ?? viaTile.tileHeight,
    tileSize: opts?.tileSize,
    portPitch: opts?.portPitch,
    clearance: opts?.clearance,
    concavityTolerance: opts?.concavityTolerance,
  })

  return {
    regions,
    ports,
    viaTile: generatedViaTile,
    tileCount,
  }
}
