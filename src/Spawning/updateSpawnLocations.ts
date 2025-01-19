import { ILocation } from "@spt/models/eft/common/ILocation";
import { configLocations } from "./constants";
import _config from "../../config/config.json";
import { getRandomInArray } from "./utils";
import { ISpawnPointParam } from "@spt/models/eft/common/ILocationBase";
import { globalValues } from "../GlobalValues";

export default function updateSpawnLocations(locationList: ILocation[]) {
  for (let index = 0; index < locationList.length; index++) {
    const map = configLocations[index];
    const playerSpawns = [];
    const mapSpawns = globalValues.indexedMapSpawns[index];

    locationList[index].base.SpawnPointParams = mapSpawns.filter((point) => {
      if (point?.BotZoneName?.slice(0, 5) === "coop_") {
        playerSpawns.push(point);
        return false;
      }
      return true;
    });

    const playerSpawn: ISpawnPointParam = getRandomInArray(playerSpawns); //playerSpawns[20];
    // console.log(playerSpawn.n)
    // console.log(map, playerSpawn.Position);

    locationList[index].base.SpawnPointParams.push(playerSpawn);
  }
}
