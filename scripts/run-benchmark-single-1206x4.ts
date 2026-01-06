import { generateJumperX4Grid } from "../lib/JumperGraphSolver/jumper-graph-generator/generateJumperX4Grid"
import { createProblemFromBaseGraph } from "../lib/JumperGraphSolver/jumper-graph-generator/createProblemFromBaseGraph"
import { JumperGraphSolver } from "../lib/JumperGraphSolver/JumperGraphSolver"

const SAMPLES_PER_CROSSING_COUNT = 100
const MIN_CROSSINGS = 2
const MAX_CROSSINGS = 10
const MAX_ITERATIONS = 10_000

const createBaseGraph = () =>
  generateJumperX4Grid({
    cols: 1,
    rows: 1,
    marginX: 1.2,
    marginY: 1.2,
    outerPaddingX: 2,
    outerPaddingY: 2,
    innerColChannelPointCount: 3,
    innerRowChannelPointCount: 3,
    outerChannelXPointCount: 5,
    outerChannelYPointCount: 5,
    regionsBetweenPads: true,
  })

console.log("Benchmark: Single 1206x4 Jumper Grid Solver")
console.log("=".repeat(50))
console.log(
  `Testing ${MIN_CROSSINGS}-${MAX_CROSSINGS} connections with ${SAMPLES_PER_CROSSING_COUNT} samples each\n`,
)

const results: {
  numConnections: number
  successRate: number
  successes: number
}[] = []

for (
  let numCrossings = MIN_CROSSINGS;
  numCrossings <= MAX_CROSSINGS;
  numCrossings++
) {
  let successes = 0

  for (
    let sampleIndex = 0;
    sampleIndex < SAMPLES_PER_CROSSING_COUNT;
    sampleIndex++
  ) {
    const randomSeed = 1000 * numCrossings + sampleIndex

    const graphWithConnections = createProblemFromBaseGraph({
      baseGraph: createBaseGraph(),
      numCrossings: numCrossings,
      randomSeed,
    })

    const solver = new JumperGraphSolver({
      inputGraph: {
        regions: graphWithConnections.regions,
        ports: graphWithConnections.ports,
      },
      inputConnections: graphWithConnections.connections,
    })

    // Run solver with iteration limit
    let iterations = 0
    try {
      while (!solver.solved && !solver.failed && iterations < MAX_ITERATIONS) {
        solver.step()
        iterations++
      }

      if (solver.solved) {
        successes++
      }
    } catch {
      // Solver threw an error, count as failure
    }
  }

  const successRate = (successes / SAMPLES_PER_CROSSING_COUNT) * 100
  results.push({ numConnections: numCrossings, successRate, successes })

  console.log(
    `Crossings: ${numCrossings.toString().padStart(2)} | ` +
      `Success: ${successes.toString().padStart(3)}/${SAMPLES_PER_CROSSING_COUNT} | ` +
      `Rate: ${successRate.toFixed(1).padStart(5)}%`,
  )
}

console.log("\n" + "=".repeat(50))
console.log("Summary:")
console.log("=".repeat(50))

const avgSuccessRate =
  results.reduce((sum, r) => sum + r.successRate, 0) / results.length
console.log(`Average success rate: ${avgSuccessRate.toFixed(1)}%`)

const perfectScores = results.filter((r) => r.successRate === 100).length
console.log(`Crossing counts with 100% success: ${perfectScores}`)

const zeroScores = results.filter((r) => r.successRate === 0).length
console.log(`Crossing counts with 0% success: ${zeroScores}`)
