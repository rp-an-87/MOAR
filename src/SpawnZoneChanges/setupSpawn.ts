import { DatabaseServer } from "@spt/servers/DatabaseServer";
import { configLocations, originalMapList } from "../Spawning/constants";
import { DependencyContainer } from "tsyringe";
import mapConfig from "../../config/mapConfig.json";
import advancedConfig from "../../config/advancedConfig.json";
import { ISpawnPointParam } from "@spt/models/eft/common/ILocationBase";
import { globalValues } from "../GlobalValues";
import {
  AddCustomBotSpawnPoints,
  AddCustomPlayerSpawnPoints,
  cleanClosest,
  getClosestZone,
  removeClosestSpawnsFromCustomBots,
} from "../Spawning/spawnZoneUtils";
import { shuffle } from "../Spawning/utils";
import { saveToFile } from "../utils";
import { Ixyz } from "@spt/models/eft/common/Ixyz";
import { BotSpawns } from "../Spawns";
import { updateAllBotSpawns } from "../Spawns/updateUtils";

export const setupSpawns = (container: DependencyContainer) => {
  const databaseServer = container.resolve<DatabaseServer>("DatabaseServer");
  const { locations } = databaseServer.getTables();

  const indexedMapSpawns: Record<number, ISpawnPointParam[]> = {};

  const botSpawnHash = BotSpawns

  originalMapList.forEach((map, mapIndex) => {
    const limit = mapConfig[configLocations[mapIndex]].spawnMinDistance;

    locations[map].base.SpawnPointParams.forEach(
      (
        { ColliderParams, Categories }: ISpawnPointParam,
        innerIndex: number
      ) => {
        if (
          !Categories.includes("Boss") &&
          ColliderParams?._props?.Radius !== undefined &&
          ColliderParams?._props?.Radius < limit
        ) {
          locations[map].base.SpawnPointParams[
            innerIndex
          ].ColliderParams._props.Radius = limit;
        }
      }
    );

    const allZones = [
      ...new Set(
        locations[map].base.SpawnPointParams.filter(
          ({ BotZoneName }: ISpawnPointParam) => !!BotZoneName
        ).map(({ BotZoneName }: ISpawnPointParam) => BotZoneName)
      ),
    ];

    locations[map].base.OpenZones = allZones.join(",");

    let bossSpawn: ISpawnPointParam[] = [];
    let nonBossSpawns: ISpawnPointParam[] = [];
    let sniperSpawnSpawnPoints: ISpawnPointParam[] = [];
    let coopSpawns: ISpawnPointParam[] = [];

    shuffle<ISpawnPointParam[]>(locations[map].base.SpawnPointParams).forEach(
      (point) => {
        switch (true) {
          case point.Categories.includes("Boss"):
            bossSpawn.push(point);
            break;
          case point.BotZoneName?.toLowerCase().includes("snipe") ||
            point.DelayToCanSpawnSec > 40:
            sniperSpawnSpawnPoints.push(point);
            break;

          case point.Categories.includes("Player") && // (point.Categories.includes("Coop") || )
            !!point.Infiltration:
            coopSpawns.push(point);
            break;

          default:
            nonBossSpawns.push(point);
            break;
        }
      }
    );

    const sniperZones = new Set(sniperSpawnSpawnPoints.map((point) => point.BotZoneName).filter((item) => !!item))
    // console.log(sniperZones)
    const zoneHash: Record<string, Ixyz> = {};


    [...coopSpawns, ...nonBossSpawns, ...bossSpawn].forEach((point) => {
      if (!point.BotZoneName || sniperZones.has(point.BotZoneName)) return;
      if (!zoneHash[point.BotZoneName]) {
        zoneHash[point.BotZoneName] = point.Position;
      } else {
        zoneHash[point.BotZoneName].x = Math.round(
          (zoneHash[point.BotZoneName].x + point.Position.x) / 2
        );
        zoneHash[point.BotZoneName].z = Math.round(
          (zoneHash[point.BotZoneName].z + point.Position.z) / 2
        );
      }
    });

    globalValues.zoneHash[mapIndex] = zoneHash;

    coopSpawns = cleanClosest(
      AddCustomPlayerSpawnPoints(coopSpawns, map, configLocations[mapIndex]),
      configLocations[mapIndex]
    ).map((point, index) =>
      !!point.Categories.length
        ? {
          ...point,
          Categories: ["Player"],
          BotZoneName: point?.BotZoneName
            ? point.BotZoneName
            : "coop_" + index,
          CorePointId: 0,
          Sides: ["Pmc"],
        }
        : point
    );

    if (advancedConfig.ActivateSpawnCullingOnServerStart) {
      botSpawnHash[map] = removeClosestSpawnsFromCustomBots(nonBossSpawns, map, configLocations[mapIndex]) || []
    }

    nonBossSpawns = cleanClosest(
      AddCustomBotSpawnPoints(nonBossSpawns, map, mapIndex),
      configLocations[mapIndex],
    ).map((point) =>
      !!point.Categories.length
        ? {
          ...point,
          BotZoneName: point?.BotZoneName
            ? point.BotZoneName
            : getClosestZone(mapIndex, point.Position.x, point.Position.y, point.Position.z),
          Categories: ["Bot"],
          // Infiltration: "",
          Sides: ["Savage"],
          CorePointId: 1,
        }
        : point
    );

    // if (map === "factory4_day") {
    //   zoneHash[mapIndex],
    //     console.log(new Set(nonBossSpawns.map(({ BotZoneName }) => BotZoneName)));
    // }

    indexedMapSpawns[mapIndex] = [
      ...sniperSpawnSpawnPoints,
      ...bossSpawn,
      ...nonBossSpawns,
      ...coopSpawns,
    ];

    // const added = indexedMapSpawns[mapIndex].filter(
    //   ({ BotZoneName }) => BotZoneName?.slice(0, 6) === "Added_"
    // );
    // console.log(
    //   map,
    //   "total added",
    //   added.length,
    //   "player",
    //   added.filter(({ Categories }) => Categories[0] === "Player").length,
    //   "bot",
    //   added.filter(({ Categories }) => Categories[0] === "Bot").length
    // );

    //;
    // console.log(locations[map].base.SpawnPointParams.length, indexedMapSpawns[mapIndex].filter(({ Categories }) => Categories.length).length)


    locations[map].base.SpawnPointParams = [];
  });

  advancedConfig.ActivateSpawnCullingOnServerStart && updateAllBotSpawns(botSpawnHash)
  // console.log(globalValues.zoneHash)
  // saveToFile(globalValues.zoneHash, "zoneHash.json");
  globalValues.indexedMapSpawns = indexedMapSpawns;
};
