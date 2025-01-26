import _config from "../../config/config.json";
import { ISpawnPointParam } from "@spt/models/eft/common/ILocationBase";
import { shuffle } from "./utils";
import mapConfig from "../../config/mapConfig.json";
import { BotSpawns, PlayerSpawns } from "../Spawns";
import { Ixyz } from "@spt/models/eft/common/Ixyz";
import { saveToFile } from "src/utils";

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
      return {
        ...rest,
        Position,
        DelayToCanSpawnSec: 9999999,
        CorePointId: 99999,
        BotZoneName: "_removed",
        Categories: [],
        Sides: [],
      };
    }

    prev = Position;
    return { Position, ...rest };
  });

  if (_config.debug) {
    const actualCulled = culled.filter(({ Categories }) => !!Categories.length);
    console.log(
      map,
      "Reduced to " +
        Math.round((actualCulled.length / culled.length) * 100) +
        "% of original spawns",
      culled.length,
      ">",
      actualCulled.length
      // "\n"
    ); // high, low}
  }
  return culled;
}

function uuidv4() {
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
    (
      +c ^
      (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (+c / 4)))
    ).toString(16)
  );
}

export const AddCustomBotSpawnPoints = (
  SpawnPointParams: ISpawnPointParam[],
  map: string,
  mapConfigMap: string
) => {
  if (!BotSpawns[map] || !BotSpawns[map].length) {
    _config.debug && console.log("no custom Bot spawns for " + map);
    return SpawnPointParams;
  }

  const spawnMinDistance =
    mapConfig[mapConfigMap as keyof typeof mapConfig].spawnMinDistance;

  const botSpawns = BotSpawns[map].map((coords: Ixyz, index) => ({
    BotZoneName: "Added_" + index,
    Categories: ["Bot"],
    ColliderParams: {
      _parent: "SpawnSphereParams",
      _props: {
        Center: {
          x: 0,
          y: 0,
          z: 0,
        },
        Radius: spawnMinDistance,
      },
    },
    CorePointId: 1,
    DelayToCanSpawnSec: 4,
    Id: uuidv4(),
    Infiltration: "",
    Position: coords,
    Rotation: 116.208389,
    Sides: ["Savage"],
  }));

  // const targetSpawnPoints = SpawnPointParams.filter(({ Categories }) => Categories)

  // const mapCullingNearPointValue =
  //   mapConfig[mapConfigMap as keyof typeof mapConfig].mapCullingNearPointValue;

  // const originalSubSet = SpawnPointParams.map(({ Position }) => Position)

  // const culled = BotSpawns[map].filter((Position) => {
  //   for (const original of originalSubSet) {
  //     if (
  //       getDistance(original.x, original.z, Position.x, Position.z) <
  //       mapCullingNearPointValue
  //     ) {
  //       return false
  //     }
  //   }

  //   return true
  // });

  // console.log(culled.length)
  //...SpawnPointParams,
  return [...SpawnPointParams, ...botSpawns];
};

export const AddCustomPlayerSpawnPoints = (
  SpawnPointParams: ISpawnPointParam[],
  map: string,
  mapConfigMap: string
) => {
  if (!PlayerSpawns[map] || !PlayerSpawns[map].length) {
    _config.debug && console.log("no custom Player spawns for " + map);
    return SpawnPointParams;
  }

  const infilHash: Record<string, Ixyz> = {};

  SpawnPointParams.forEach((point) => {
    if (!infilHash[point.Infiltration]) {
      infilHash[point.Infiltration] = point.Position;
    } else {
      infilHash[point.Infiltration].x = Math.round(
        (infilHash[point.Infiltration].x + point.Position.x) / 2
      );
      infilHash[point.Infiltration].z = Math.round(
        (infilHash[point.Infiltration].z + point.Position.z) / 2
      );
    }
  });

  const getClosestInfil = (x: number, z: number) => {
    let closest = Infinity;
    let selectedInfil = Object.keys(infilHash)[0];
    Object.keys(infilHash).forEach((infil) => {
      const current = infilHash[infil];
      const dist = getDistance(current.x, current.z, x, z);
      if (dist < closest) {
        closest = dist;
        selectedInfil = infil;
      }
    });

    return selectedInfil;
  };

  const spawnMinDistance =
    mapConfig[mapConfigMap as keyof typeof mapConfig].spawnMinDistance;

  const playerSpawns = PlayerSpawns[map].map((coords: Ixyz, index) => ({
    BotZoneName: "Added_" + index,
    Categories: ["Player"],
    ColliderParams: {
      _parent: "SpawnSphereParams",
      _props: {
        Center: {
          x: 0,
          y: 0,
          z: 0,
        },
        Radius: spawnMinDistance,
      },
    },
    CorePointId: 0,
    DelayToCanSpawnSec: 4,
    Id: uuidv4(),
    Infiltration: getClosestInfil(coords.x, coords.z),
    Position: coords,
    Rotation: 116.208389,
    Sides: ["Pmc"],
  }));

  return [...SpawnPointParams, ...playerSpawns];
};
