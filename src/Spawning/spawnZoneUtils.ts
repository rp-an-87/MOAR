import _config from "../../config/config.json";
import { ISpawnPointParam } from "@spt/models/eft/common/ILocationBase";
import { shuffle } from "./utils";
import mapConfig from "../../config/mapConfig.json";
import { BotSpawns, PlayerSpawns } from "../Spawns";
import { Ixyz } from "@spt/models/eft/common/Ixyz";
import { globalValues } from "../GlobalValues";
import { configLocations } from "./constants";

// const getDistance = (x: number, z: number, mX: number, mZ: number) => {
//   const pA1 = x - mX;
//   const pB2 = z - mZ;

//   return Math.sqrt(pA1 * pA1 + pB2 * pB2);
// };

function sq(n: number) {
  return n * n;
}

function pt(a: number, b: number) {
  return Math.sqrt(sq(a) + sq(b));
}

export const getDistance = (x: number, y: number, z: number, mX: number, mY: number, mZ: number) => {
  x = Math.abs(x - mX),
    y = Math.abs(y - mY),
    z = Math.abs(z - mZ);

  return pt(pt(x, z), y);
}

export default function getSortedSpawnPointList(
  SpawnPointParams: ISpawnPointParam[],
  mX: number,
  my: number,
  mZ: number,
  cull?: number
): ISpawnPointParam[] {
  let culledAmount = 0;

  const sortedCulledResult = SpawnPointParams.sort((a, b) => {
    const a1 = getDistance(a.Position.x, a.Position.y, a.Position.z, mX, my, mZ);
    const b1 = getDistance(b.Position.x, b.Position.y, b.Position.z, mX, my, mZ);
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
  mapIndex: number,
  player?: boolean
): ISpawnPointParam[] {
  const map = configLocations[mapIndex]

  const mapCullingNearPointValue = player ? mapConfig[map].mapCullingNearPointValuePlayer : mapConfig[map].mapCullingNearPointValue
  const okayList = new Set()
  const filteredParams = SpawnPointParams.map((point) => {
    const { Position: { x: X, y: Y, z: Z } } = point
    const result = !SpawnPointParams.some(({ Position: { z, x, y }, Id }) => {
      const dist = getDistance(X, Y, Z, x, y, z)
      return mapCullingNearPointValue > dist && dist !== 0 && !okayList.has(Id)
    })

    if (!result) { okayList.add(point.Id) }

    return result ? point : {
      ...point,
      ...player ? {} : {
        DelayToCanSpawnSec: 9999999,
      },
      CorePointId: 99999,
      Categories: [],
      Sides: [],
    }
  }
  )

  if (_config.debug) {
    const actualCulled = filteredParams.filter(({ Categories }) => !!Categories.length);
    console.log(map,
      filteredParams.length,
      ">",
      actualCulled.length,
      "Reduced to " + Math.round((actualCulled.length / filteredParams.length) * 100) +
      "% of original spawns",
      player ? "player" : "bot",
    ); // high, low}
  }

  return filteredParams


  // const mapCullingNearPointValue =
  //   mapConfig[map as keyof typeof mapConfig].mapCullingNearPointValue;

  // const sortedSpawnPoints = getSortedSpawnPointList(
  //   SpawnPointParams,
  //   -100000,
  //   -100000,
  //   -100000
  // );

  // let prev = undefined;

  // const culled = sortedSpawnPoints.map(({ Position, ...rest }) => {
  //   // const fromMiddle = getDistance(Position.x, Position.z, mX, mZ)
  //   if (
  //     !!prev &&
  //     getDistance(prev.x, prev.y, prev.z, Position.x, Position.y, Position.z) <
  //     mapCullingNearPointValue
  //   ) {
  //     return {
  //       ...rest,
  //       Position,
  //       DelayToCanSpawnSec: 9999999,
  //       CorePointId: 99999,
  //       BotZoneName: "_removed",
  //       Categories: [],
  //       Sides: [],
  //     };
  //   }

  //   customs 124 > 118 Reduced to 95% of original spawns player
  // customs 271 > 218 Reduced to 80% of original spawns bot
  // factoryDay 88 > 87 Reduced to 99% of original spawns player
  // factoryDay 69 > 67 Reduced to 97% of original spawns bot
  // factoryNight 85 > 85 Reduced to 100% of original spawns player
  // factoryNight 69 > 67 Reduced to 97% of original spawns bot
  // interchange 125 > 77 Reduced to 62% of original spawns player
  // interchange 114 > 85 Reduced to 75% of original spawns bot
  // laboratory 75 > 60 Reduced to 80% of original spawns player
  // laboratory 40 > 37 Reduced to 93% of original spawns bot
  // lighthouse 60 > 60 Reduced to 100% of original spawns player
  // lighthouse 131 > 114 Reduced to 87% of original spawns bot
  // rezervbase 80 > 74 Reduced to 93% of original spawns player
  // rezervbase 109 > 81 Reduced to 74% of original spawns bot
  // shoreline 130 > 92 Reduced to 71% of original spawns player
  // shoreline 145 > 105 Reduced to 72% of original spawns bot
  // tarkovstreets 196 > 125 Reduced to 64% of original spawns player
  // tarkovstreets 226 > 175 Reduced to 77% of original spawns bot
  // woods 142 > 92 Reduced to 65% of original spawns player
  // woods 310 > 250 Reduced to 81% of original spawns bot
  // gzLow 100 > 79 Reduced to 79% of original spawns player
  // gzLow 127 > 106 Reduced to 83% of original spawns bot
  // gzHigh 100 > 80 Reduced to 80% of original spawns player
  // gzHigh 118 > 99 Reduced to 84% of original spawns bot

  //   prev = Position;
  //   return { Position, ...rest };
  // });

  // if (!_config.debug) {
  //   const actualCulled = culled.filter(({ Categories }) => !!Categories.length);
  //   console.log(
  //     map,
  //     "Reduced to " +
  //     Math.round((actualCulled.length / culled.length) * 100) +
  //     "% of original spawns",
  //     culled.length,
  //     ">",
  //     actualCulled.length
  //     // "\n"
  //   ); // high, low}
  // }

  // return culled;
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
  mapIndex: number,
) => {
  const mapConfigMap = configLocations[mapIndex];

  if (!BotSpawns[map] || !BotSpawns[map].length) {
    _config.debug && console.log("no custom Bot spawns for " + map);
    return SpawnPointParams;
  }

  const spawnMinDistance =
    mapConfig[mapConfigMap as keyof typeof mapConfig].spawnMinDistance;

  const botSpawns = BotSpawns[map].map((coords: Ixyz, index: number) => ({
    BotZoneName:
      getClosestZone(SpawnPointParams, coords.x, coords.y, coords.z),
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

  const getClosestInfil = (x: number, y: number, z: number) => {
    let closest = Infinity;
    let selectedInfil = Object.keys(infilHash)[0];
    Object.keys(infilHash).forEach((infil) => {
      const current = infilHash[infil];
      const dist = getDistance(current.x, current.y, current.z, x, y, z);
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
    Infiltration: getClosestInfil(coords.x, coords.y, coords.z),
    Position: coords,
    Rotation: 116.208389,
    Sides: ["Pmc"],
  }));

  return [...SpawnPointParams, ...playerSpawns];
};

export const getClosestZone = (params: ISpawnPointParam[], x: number, y: number, z: number) => {

  if (Array.isArray(params) && !params.filter(({ BotZoneName }) => BotZoneName).length) return "";

  return getSortedSpawnPointList(params, x, y, z).find(({ BotZoneName }) => !!BotZoneName)?.BotZoneName || ""
  // let closest = Infinity;
  // let selectedZone = Object.keys(globalValues.zoneHash[mapIndex])?.[0];
  // Object.keys(globalValues.zoneHash[mapIndex]).forEach((zone) => {
  //   const current = globalValues.zoneHash[mapIndex][zone];
  //   const dist = getDistance(current.x, current.y, current.z, x, y, z);
  //   if (dist < closest) {
  //     closest = dist;
  //     selectedZone = zone;
  //   }
  // });
  // // if (mapIndex === 0) console.log(selectedZone)

  // return selectedZone || "";
};



export const removeClosestSpawnsFromCustomBots = (SpawnPointParams: ISpawnPointParam[],
  map: string, mapConfigMap: string) => {
  if (!BotSpawns[map] || !BotSpawns[map].length) {
    console.log("No map called ", map)
    return;
  }

  const coords: Ixyz[] = BotSpawns[map]

  const mapCullingNearPointValue = mapConfig[mapConfigMap].mapCullingNearPointValue



  let filteredCoords = coords.filter(({ x: X, y: Y, z: Z }) =>
    !SpawnPointParams.some(({ Position: { z, x, y } }) => {
      return mapCullingNearPointValue > getDistance(X, Y, Z, x, y, z)
    })
  )

  const okayList = new Set()

  filteredCoords = [...coords].filter(({ x: X, y: Y, z: Z }, index) => {
    const result = !coords.some(({ z, x, y }) => {
      const dist = getDistance(X, Y, Z, x, y, z)
      return mapCullingNearPointValue * 1.3 > dist && dist !== 0 && !okayList.has("" + x + y + z)
    })
    if (!result) okayList.add("" + X + Y + Z)
    return result
  })

  console.log(map, coords.length, ">", filteredCoords.length, "culled", coords.length - filteredCoords.length, "spawns")
  return filteredCoords
}
