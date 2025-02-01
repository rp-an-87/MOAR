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
  AddCustomSniperSpawnPoints,
  cleanClosest,
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

  const botSpawnHash = BotSpawns;

  originalMapList.forEach((map, mapIndex) => {
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
            (map !== "lighthouse" && point.DelayToCanSpawnSec > 40):
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

    sniperSpawnSpawnPoints.map((val, index) => {
      if (!val.BotZoneName) val.BotZoneName === "ZoneSnipeMoar_" + index;
      return val;
    });

    const sniperZones = new Set(
      sniperSpawnSpawnPoints
        .map((point) => point.BotZoneName)
        .filter((item) => !!item)
    );

    const limit = mapConfig[configLocations[mapIndex]].spawnMinDistance;

    coopSpawns = cleanClosest(
      AddCustomPlayerSpawnPoints(coopSpawns, map),
      mapIndex,
      true
    )
      .map((point, index) => {
        if (point.ColliderParams?._props?.Radius < limit) {
          point.ColliderParams._props.Radius = limit;
        }
        return !!point.Categories.length
          ? {
              ...point,
              Categories: ["Player"],
              BotZoneName: point?.BotZoneName
                ? point.BotZoneName
                : "coop_" + index,
              CorePointId: 0,
              Sides: ["Pmc"],
            }
          : point;
      })
      .filter((point) => {
        // Now we transfer the extra spawns to the bots
        if (!point.Categories.length) {
          nonBossSpawns.push(point);
        }
        return !!point.Categories.length;
      });

    if (advancedConfig.ActivateSpawnCullingOnServerStart) {
      botSpawnHash[map] =
        removeClosestSpawnsFromCustomBots(
          nonBossSpawns,
          map,
          configLocations[mapIndex]
        ) || [];
    }

    nonBossSpawns = cleanClosest(
      AddCustomBotSpawnPoints(nonBossSpawns, map),
      mapIndex
    ).map((point) => {
      if (point.ColliderParams?._props?.Radius < limit) {
        point.ColliderParams._props.Radius = limit;
      }

      return !!point.Categories.length
        ? {
            ...point,
            BotZoneName: point?.BotZoneName || "",
            Categories: ["Bot"],
            Sides: ["Savage"],
            CorePointId: 1,
          }
        : point;
    });

    sniperSpawnSpawnPoints = AddCustomSniperSpawnPoints(
      sniperSpawnSpawnPoints,
      map
    );

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

  advancedConfig.ActivateSpawnCullingOnServerStart &&
    updateAllBotSpawns(botSpawnHash);
  globalValues.indexedMapSpawns = indexedMapSpawns;
};
