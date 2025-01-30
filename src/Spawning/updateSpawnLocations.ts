import { ILocation } from "@spt/models/eft/common/ILocation";
import { configLocations } from "./constants";
import _config from "../../config/config.json";
import { getRandomInArray, shuffle } from "./utils";
import { ISpawnPointParam } from "@spt/models/eft/common/ILocationBase";
import { globalValues } from "../GlobalValues";
import getSortedSpawnPointList from "./spawnZoneUtils";

export default function updateSpawnLocations(locationList: ILocation[]) {
  for (let index = 0; index < locationList.length; index++) {
    const map = configLocations[index];
    const playerSpawns: ISpawnPointParam[] = [];
    // const addedSpawns: ISpawnPointParam[] = [];
    const mapSpawns = globalValues.indexedMapSpawns[index];

    const filteredSpawns = [...mapSpawns].filter(
      (point) => {
        if (point?.Categories[0] === "Player") {
          playerSpawns.push(point);
          return false;
        }

        return true;
      }
    )


    const playerSpawn: ISpawnPointParam = getRandomInArray(playerSpawns);
    const { x, y, z } = playerSpawn.Position

    const hash = {}

    const sortedSpawnPointList = getSortedSpawnPointList(filteredSpawns, x, y, z).map((point, pIndex) => {
      const { BotZoneName, Categories, DelayToCanSpawnSec } = point
      if (BotZoneName && !Categories.includes("Boss") &&
        Categories[0] === "Bot" &&
        !(
          BotZoneName?.toLowerCase().includes("snipe") ||
          DelayToCanSpawnSec > 40
        )) {

        if (!hash[BotZoneName]) hash[BotZoneName] = 1

        hash[BotZoneName] = pIndex % 2 === 0 ? hash[BotZoneName] + 1 : hash[BotZoneName]

        point.CorePointId = hash[BotZoneName]

        return point
      } else return point
    })


    // console.log(map, hash)

    locationList[index].base.SpawnPointParams = sortedSpawnPointList


    playerSpawn.ColliderParams._props.Radius = 1;


    const listToAddToOpenZones = shuffle<string[]>([
      ...new Set(
        locationList[index].base.SpawnPointParams.map(
          (point) => point.BotZoneName
        )
      ),
    ]).filter((_, i) => i < 20);

    locationList[index].base.OpenZones = listToAddToOpenZones.join(",");

    locationList[index].base.SpawnPointParams.push(playerSpawn);
  }
}
