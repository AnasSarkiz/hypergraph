#!/usr/bin/env bun

import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { getSvgFromGraphicsObject } from "graphics-debug"
import type { JPort, JRegion } from "../lib/JumperGraphSolver/jumper-types"
import { visualizeJumperGraph } from "../lib/JumperGraphSolver/visualizeJumperGraph"
import {
  bakeViaTile,
  type BakedViaTile,
} from "../lib/ViaGraphSolver/via-graph-generator/bakeViaTile"
import type { ViaTile } from "../lib/ViaGraphSolver/ViaGraphSolver"

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url))
const ASSETS_DIR = path.join(SCRIPT_DIR, "..", "assets", "ViaGraphSolver")
const DEFAULT_INPUT_FILES = [
  "via-tile-3-regions.json",
  "via-tile-4-regions.json",
  "via-tile-5-regions.json",
  "via-tile-6-regions.json",
]
const NET_COLOR_PALETTE = [
  "rgba(231, 76, 60, 0.35)",
  "rgba(46, 204, 113, 0.35)",
  "rgba(52, 152, 219, 0.35)",
  "rgba(243, 156, 18, 0.35)",
  "rgba(155, 89, 182, 0.35)",
  "rgba(26, 188, 156, 0.35)",
  "rgba(241, 196, 15, 0.35)",
  "rgba(230, 126, 34, 0.35)",
]
const regionFromBaked = (region: BakedViaTile["regions"][number]): JRegion => ({
  regionId: region.regionId,
  ports: [],
  d: {
    bounds: region.bounds,
    center: region.center,
    polygon: region.polygon,
    isPad: false,
    isViaRegion: region.isViaRegion,
  },
})

function buildBakedViaTileSvg(bakedViaTile: BakedViaTile): string {
  const regions = bakedViaTile.regions.map(regionFromBaked)
  const regionById = new Map(regions.map((region) => [region.regionId, region]))

  const ports: JPort[] = bakedViaTile.insidePorts
    .map((port) => {
      const region1 = regionById.get(port.region1Id)
      const region2 = regionById.get(port.region2Id)
      if (!region1 || !region2) return null

      const jPort: JPort = {
        portId: port.portId,
        region1,
        region2,
        d: { x: port.position.x, y: port.position.y },
      }
      region1.ports.push(jPort)
      region2.ports.push(jPort)
      return jPort
    })
    .filter((port): port is JPort => Boolean(port))

  const graphics = visualizeJumperGraph(
    { regions, ports },
    {
      hideRegionPortLines: true,
      hideConnectionLines: true,
      hidePortPoints: false,
    },
  ) as Required<ReturnType<typeof visualizeJumperGraph>>

  for (const polygon of graphics.polygons) {
    polygon.stroke = "rgba(120, 120, 120, 0.55)"
    polygon.strokeWidth = 0.009
  }

  const outerIds = new Set(["T", "B", "L", "R"])
  const netColorMap = new Map<string, string>()
  let netColorIndex = 0
  let polyIndex = 0
  for (const region of regions) {
    const hasPolygon = region.d.polygon && region.d.polygon.length >= 3
    if (!hasPolygon) continue

    const suffix = region.regionId.split(":").pop() ?? ""
    const isOuter = outerIds.has(suffix)
    if (!isOuter && !region.d.isConnectionRegion) {
      if (!netColorMap.has(suffix)) {
        netColorMap.set(
          suffix,
          NET_COLOR_PALETTE[netColorIndex % NET_COLOR_PALETTE.length],
        )
        netColorIndex++
      }
      if (graphics.polygons[polyIndex]) {
        graphics.polygons[polyIndex].fill = netColorMap.get(suffix)!
      }
    }
    polyIndex++
  }

  if (!graphics.circles) graphics.circles = []
  for (const [netName, vias] of Object.entries(bakedViaTile.viasByNet)) {
    const fill = (netColorMap.get(netName) ?? "rgba(255, 0, 0, 0.35)").replace(
      "0.35",
      "0.5",
    )
    for (const via of vias) {
      graphics.circles.push({
        center: via.position,
        radius: via.diameter / 2,
        fill,
        label: netName,
      })
    }
  }

  return getSvgFromGraphicsObject(graphics)
}

function toAbsPath(input: string): string {
  return path.isAbsolute(input) ? input : path.resolve(process.cwd(), input)
}

function outputPathsForInput(inputPath: string): {
  bakedJsonPath: string
  bakedSvgPath: string
} {
  const ext = path.extname(inputPath)
  const base = ext ? inputPath.slice(0, -ext.length) : inputPath
  return {
    bakedJsonPath: `${base}-baked.json`,
    bakedSvgPath: `${base}-baked.svg`,
  }
}

async function writeBakedOutputs(
  bakedViaTile: BakedViaTile,
  bakedJsonPath: string,
  bakedSvgPath: string,
): Promise<void> {
  const svg = buildBakedViaTileSvg(bakedViaTile)
  await fs.mkdir(path.dirname(bakedJsonPath), { recursive: true })
  await fs.writeFile(
    bakedJsonPath,
    `${JSON.stringify(bakedViaTile, null, 2)}\n`,
    "utf8",
  )
  await fs.mkdir(path.dirname(bakedSvgPath), { recursive: true })
  await fs.writeFile(bakedSvgPath, `${svg}\n`, "utf8")
}

async function main() {
  const inputArgs = process.argv.slice(2)
  const inputPaths =
    inputArgs.length > 0
      ? inputArgs.map(toAbsPath)
      : DEFAULT_INPUT_FILES.map((name) => path.join(ASSETS_DIR, name))

  for (const inputPath of inputPaths) {
    const fileContent = await fs.readFile(inputPath, "utf8")
    const viaTile: ViaTile = JSON.parse(fileContent)
    const bakedViaTile = bakeViaTile(viaTile)
    const { bakedJsonPath, bakedSvgPath } = outputPathsForInput(inputPath)

    await writeBakedOutputs(bakedViaTile, bakedJsonPath, bakedSvgPath)

    const regionCount = bakedViaTile.regions.length
    const viaRegionCount = bakedViaTile.regions.filter(
      (r) => r.isViaRegion,
    ).length
    const convexRegionCount = regionCount - viaRegionCount
    const insidePortCount = bakedViaTile.insidePorts.length

    console.log(
      `Baked ${path.basename(inputPath)} -> ${path.basename(bakedJsonPath)} (${regionCount} regions: ${convexRegionCount} convex + ${viaRegionCount} via, ${insidePortCount} inside ports)`,
    )
    console.log(`SVG: ${bakedSvgPath}`)
  }
}

if (import.meta.main) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(1)
  })
}
