import { ILocation } from "@spt/models/eft/common/ILocation";
import { configLocations } from "./constants";
import _config from "../../config/config.json";
import { getRandomInArray, shuffle } from "./utils";
import { ISpawnPointParam } from "@spt/models/eft/common/ILocationBase";
import { globalValues } from "../GlobalValues";
import getSortedSpawnPointList from "./spawnZoneUtils";

export default function updateSpawnLocations(
  locationList: ILocation[],
  config: typeof _config
) {
  for (let index = 0; index < locationList.length; index++) {
    const map = configLocations[index];
    const playerSpawns: ISpawnPointParam[] = [];
    // const addedSpawns: ISpawnPointParam[] = [];
    const mapSpawns = globalValues.indexedMapSpawns[index];

    const filteredSpawns = [...mapSpawns].filter((point) => {
      if (point?.["type"] === "coop") {
        playerSpawns.push(point);
        return false;
      }

      return true;
    });

    const playerSpawn: ISpawnPointParam = getRandomInArray(playerSpawns);

    const { x, y, z } = playerSpawn.Position;

    const sortedSpawnPointList = getSortedSpawnPointList(
      config.randomSpawns ? mapSpawns : filteredSpawns,
      x,
      y,
      z
    );

    locationList[index].base.SpawnPointParams = sortedSpawnPointList;

    const listToAddToOpenZones = shuffle<string[]>([
      ...new Set(
        locationList[index].base.SpawnPointParams.map(
          (point) => point.BotZoneName
        )
      ),
    ]).filter((_, i) => i < 20);

    locationList[index].base.OpenZones = listToAddToOpenZones.join(",");

    if (!config.randomSpawns) {
      playerSpawn.ColliderParams._props.Radius = 1;

      locationList[index].base.SpawnPointParams.push(playerSpawn);
    }
  }
}
