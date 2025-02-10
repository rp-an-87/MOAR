import { ILocation } from "@spt/models/eft/common/ILocation";
import { configLocations } from "./constants";
import _config from "../../config/config.json";
import { getRandomInArray, shuffle } from "./utils";
import advancedConfig from "../../config/advancedConfig.json";
import { ISpawnPointParam } from "@spt/models/eft/common/ILocationBase";
import { globalValues } from "../GlobalValues";
import getSortedSpawnPointList, {
  getClosestZone,
  getDistance,
} from "./spawnZoneUtils";

export default function updateSpawnLocations(
  locationList: ILocation[],
  config: typeof _config
) {
  for (let index = 0; index < locationList.length; index++) {
    const map = configLocations[index];
    const mapSpawns = [...globalValues.indexedMapSpawns[index]];

    const playerSpawns = mapSpawns.filter(
      (point) => point?.["type"] === "coop"
    );

    const playerSpawn: ISpawnPointParam = getRandomInArray(playerSpawns);

    globalValues.playerSpawn = playerSpawn;

    const { x, y, z } = playerSpawn.Position;

    const sortedSpawnPointList = getSortedSpawnPointList(mapSpawns, x, y, z);

    const possibleSpawnList: ISpawnPointParam[] = [];

    sortedSpawnPointList.forEach((point) => {
      if (
        possibleSpawnList.length <= advancedConfig.SpawnpointAreaTarget &&
        (point?.["type"] === "coop" ||
          point?.["type"] === "pmc" ||
          point?.["type"] === "scav")
      ) {
        possibleSpawnList.push({
          ...point,
          Categories: ["Player"],
          BotZoneName: point?.BotZoneName ? point.BotZoneName : "",
          CorePointId: 0,
          Sides: ["Pmc"],
          Infiltration: playerSpawn.Infiltration,
          ["type" as any]: "coop",
        });
      }
    });

    const possibleSpawnSet = new Set(possibleSpawnList.map(({ Id }) => Id));

    const canBeConverted: ISpawnPointParam[] = [];

    const filtered = sortedSpawnPointList.filter((point) => {
      if (possibleSpawnSet.has(point.Id)) return false;

      if (point.Categories[0] === "Player") {
        canBeConverted.push(point);
        return false;
      }
      return true;
    });

    const isGZ = map.includes("gz");

    const newPMCSpawns = canBeConverted.map((point) => ({
      ...point,
      BotZoneName: isGZ
        ? "ZoneSandbox"
        : getClosestZone(
            mapSpawns,
            point.Position.x,
            point.Position.y,
            point.Position.z
          ),
      Categories: ["Coop", Math.random() ? "Group" : "Opposite"],
      Sides: ["Pmc"],
      CorePointId: 0,
      ["type" as any]: "pmc",
    }));

    locationList[index].base.SpawnPointParams = filtered;
    // console.log(possibleSpawnList[0].Position)
    // possibleSpawnList.reverse()

    locationList[index].base.SpawnPointParams.push(
      ...newPMCSpawns,
      ...possibleSpawnList
    );

    locationList[index].base.SpawnPointParams = getSortedSpawnPointList(
      locationList[index].base.SpawnPointParams,
      x,
      y,
      z
    );
    // console.log(map, getDistance(possibleSpawnList[0].Position.x, possibleSpawnList[0].Position.y, possibleSpawnList[0].Position.z,
    //   possibleSpawnList[3].Position.x, possibleSpawnList[3].Position.y, possibleSpawnList[3].Position.z))
    // // console.log(map)
    // console.log(locationList[index].base.SpawnPointParams.filter(point => point?.["type"] === "pmc").length)
    // console.log(locationList[index].base.SpawnPointParams.filter(point => point?.["type"] === "coop").length)

    const listToAddToOpenZones = [
      ...new Set(
        locationList[index].base.SpawnPointParams.map(
          ({ BotZoneName }) => BotZoneName
        ).filter((zone) => !!zone)
      ),
    ];

    locationList[index].base.OpenZones = listToAddToOpenZones.join(",");
  }
}
