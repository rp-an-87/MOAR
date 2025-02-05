import _config from "../../config/config.json";
import { ISpawnPointParam } from "@spt/models/eft/common/ILocationBase";
import { shuffle } from "./utils";
import mapConfig from "../../config/mapConfig.json";

const getDistance = (x: number, z: number, mX: number, mZ: number) => {
  const pA1 = x - mX;
  const pB2 = z - mZ;

  return Math.sqrt(pA1 * pA1 + pB2 * pB2);
};

export default function getSortedSpawnPointList(
  SpawnPointParams: ISpawnPointParam[],
  mX: number,
  mZ: number,
  cull?: number
): ISpawnPointParam[] {
  let culledAmount = 0;

  const sortedCulledResult = SpawnPointParams.sort((a, b) => {
    const a1 = getDistance(a.Position.x, a.Position.z, mX, mZ);
    const b1 = getDistance(b.Position.x, b.Position.z, mX, mZ);
    return a1 - b1;
  }).filter((_, index) => {
    if (!cull) return true;
    const result = index > SpawnPointParams.length * cull;
    if (!result) culledAmount++;

    return result;
  });

  if (_config.debug && culledAmount > 0) {
    console.log(
      "Reduced to " +
      Math.round(
        (sortedCulledResult.length / SpawnPointParams.length) * 100
      ) +
      "% of original spawns",
      SpawnPointParams.length,
      ">",
      sortedCulledResult.length,
      "\n"
    );
  }
  return sortedCulledResult;
}

export function cleanClosest(
  SpawnPointParams: ISpawnPointParam[],
  map: string
): ISpawnPointParam[] {
  const mapCullingNearPointValue =
    mapConfig[map as keyof typeof mapConfig].mapCullingNearPointValue;

  const sortedSpawnPoints = getSortedSpawnPointList(
    SpawnPointParams,
    -100000,
    -100000
  );

  let prev = undefined;
  const culled = sortedSpawnPoints.map(({ Position, ...rest }) => {
    // const fromMiddle = getDistance(Position.x, Position.z, mX, mZ)
    if (
      !!prev &&
      getDistance(prev.x, prev.z, Position.x, Position.z) <
      mapCullingNearPointValue
    ) {
      return ({ ...rest, Position, DelayToCanSpawnSec: 9999999, CorePointId: 99999, BotZoneName: "_removed", Categories: [], Sides: [], });
    }

    prev = Position;
    return ({ Position, ...rest });
  });

  if (_config.debug) {
    const actualCulled = culled.filter(({ Categories }) => !!Categories.length)
    console.log(
      map,
      "Reduced to " +
      Math.round((actualCulled.length / culled.length) * 100) +
      "% of original spawns",
      culled.length,
      ">",
      actualCulled.length,
      // "\n"
    ); // high, low}
  }
  return culled;
}


// customs Reduced to 33% of original spawns 160 > 52
// customs Reduced to 98% of original spawns 81 > 79
// factoryDay Reduced to 66% of original spawns 126 > 83
// factoryDay Reduced to 95% of original spawns 19 > 18
// factoryNight Reduced to 66% of original spawns 126 > 83
// factoryNight Reduced to 95% of original spawns 19 > 18
// interchange Reduced to 34% of original spawns 171 > 58
// interchange Reduced to 77% of original spawns 52 > 40
// laboratory Reduced to 63% of original spawns 115 > 72
// laboratory Reduced to NaN% of original spawns 0 > 0
// lighthouse Reduced to 31% of original spawns 101 > 31
// lighthouse Reduced to 78% of original spawns 90 > 70
// rezervbase Reduced to 34% of original spawns 120 > 41
// rezervbase Reduced to 75% of original spawns 60 > 45
// shoreline Reduced to 30% of original spawns 171 > 51
// shoreline Reduced to 94% of original spawns 81 > 76
// tarkovstreets Reduced to 24% of original spawns 236 > 57
// tarkovstreets Reduced to 60% of original spawns 186 > 112
// woods Reduced to 32% of original spawns 181 > 58
// woods Reduced to 88% of original spawns 129 > 114
// gzLow Reduced to 34% of original spawns 140 > 47
// gzLow Reduced to 56% of original spawns 59 > 33
// gzHigh Reduced to 34% of original spawns 140 > 47
// gzHigh Reduced to 52% of original spawns 50 > 26