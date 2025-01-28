import { ILocation } from "@spt/models/eft/common/ILocation";
import { configLocations } from "./constants";
import _config from "../../config/config.json";
import { getRandomInArray, shuffle } from "./utils";
import { ISpawnPointParam } from "@spt/models/eft/common/ILocationBase";
import { globalValues } from "../GlobalValues";
import { getClosestZone } from "./spawnZoneUtils";

export default function updateSpawnLocations(locationList: ILocation[]) {
  for (let index = 0; index < locationList.length; index++) {
    const map = configLocations[index];
    const playerSpawns: ISpawnPointParam[] = [];
    const addedSpawns: ISpawnPointParam[] = [];
    const mapSpawns = globalValues.indexedMapSpawns[index];

    locationList[index].base.SpawnPointParams = [...mapSpawns].filter(
      (point) => {
        if (point?.Categories[0] === "Player") {
          playerSpawns.push(point);
          return false;
        }

        return true;
      }
    );

    // console.log(playerSpawns.length);
    // if (point.BotZoneName.includes("Added_")) {
    //   addedSpawns.push(point);
    //   return false;
    // }
    const playerSpawn: ISpawnPointParam = getRandomInArray(playerSpawns); // playerSpawns[playerSpawns.length - 1]
    playerSpawn.ColliderParams._props.Radius = 1;
    // console.log(map, playerSpawn.Position);

    const spawnsToAdd = playerSpawns
      .filter((point) => point.Id !== playerSpawn.Id)
      .map((point, pindex) => ({
        ...point,
        BotZoneName: point.BotZoneName.includes("Added_")
          ? getClosestZone(pindex, point.Position.x, point.Position.y, point.Position.z)
          : point.BotZoneName,
        Categories: ["Bot"],
        // Infiltration: "",
        Sides: ["Savage"],
        CorePointId: 1,
      }))
      .filter(({ BotZoneName }) => !!BotZoneName);

    // console.log(spawnsToAdd.map(({ BotZoneName }) => BotZoneName));

    locationList[index].base.SpawnPointParams.push(...spawnsToAdd);

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
