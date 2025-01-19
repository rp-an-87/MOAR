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
  const culled = sortedSpawnPoints.filter(({ Position }) => {
    // const fromMiddle = getDistance(Position.x, Position.z, mX, mZ)
    if (
      !!prev &&
      getDistance(prev.x, prev.z, Position.x, Position.z) <
        mapCullingNearPointValue
    ) {
      return false;
    }
    prev = Position;
    return true;
  });
  _config.debug &&
    console.log(
      map,
      "Reduced to " +
        Math.round((culled.length / sortedSpawnPoints.length) * 100) +
        "% of original spawns",
      sortedSpawnPoints.length,
      ">",
      culled.length,
      "\n"
    ); // high, low

  return culled;
}
