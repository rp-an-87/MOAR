import { DatabaseServer } from "@spt/servers/DatabaseServer";
import { configLocations, originalMapList } from "../Spawning/constants";
import { DependencyContainer } from "tsyringe";
import mapConfig from "../../config/mapConfig.json";
import { ISpawnPointParam } from "@spt/models/eft/common/ILocationBase";
import { globalValues } from "../GlobalValues";
import { cleanClosest } from "../Spawning/spawnZoneUtils";
import { shuffle } from "../Spawning/utils";

export const setupSpawns = (container: DependencyContainer) => {
  const databaseServer = container.resolve<DatabaseServer>("DatabaseServer");
  const { locations } = databaseServer.getTables();

  const indexedMapSpawns: Record<number, ISpawnPointParam[]> = {};

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

    let bossSpawnSpawns: ISpawnPointParam[] = [];
    let nonBossSpawns: ISpawnPointParam[] = [];
    let sniperSpawnSpawnPoints: ISpawnPointParam[] = [];
    let coopSpawns: ISpawnPointParam[] = [];

    shuffle<ISpawnPointParam[]>(locations[map].base.SpawnPointParams).forEach(
      (point) => {
        switch (true) {
          case point.Categories.includes("Boss"):
            bossSpawnSpawns.push(point);
            break;
          case point.BotZoneName?.toLowerCase().includes("snipe") ||
            point.DelayToCanSpawnSec > 40:
            sniperSpawnSpawnPoints.push(point);
            break;

          case (point.Categories.includes("Coop") ||
            point.Categories.includes("Player")) &&
            !!point.Infiltration:
            coopSpawns.push(point);
            break;

          default:
            nonBossSpawns.push(point);
            break;
        }
      }
    );

    coopSpawns = cleanClosest(coopSpawns, configLocations[mapIndex]).map(
      (point, index) => !!point.Categories.length ? {
        ...point,
        Categories: ["Player"],
        BotZoneName: point?.BotZoneName ? point.BotZoneName : "coop_" + index,
        CorePointId: 0,
        Sides: ["Pmc"],
      } : point
    );

    nonBossSpawns = cleanClosest(
      nonBossSpawns, configLocations[mapIndex]).map((point, index) => !!point.Categories.length ? ({
        ...point,
        BotZoneName: point?.BotZoneName ? point.BotZoneName : "open_" + index,
        Categories: ["Bot"],
        // Infiltration: "",
        Sides: ["Savage"],
        CorePointId: 1,
      }) : point);


    locations[map].base.OpenZones = "";

    indexedMapSpawns[mapIndex] = [
      ...sniperSpawnSpawnPoints,
      ...bossSpawnSpawns,
      ...nonBossSpawns,
      ...coopSpawns,
    ]//.filter(({ Categories }) => Categories.length);

    // console.log(locations[map].base.SpawnPointParams.length, indexedMapSpawns[mapIndex].filter(({ Categories }) => Categories.length).length)

    locations[map].base.SpawnPointParams = [];
  });

  globalValues.indexedMapSpawns = indexedMapSpawns;
};
