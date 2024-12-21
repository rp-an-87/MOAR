import { ILocation } from "@spt/models/eft/common/ILocation";
import { configLocations } from "./constants";
import mapConfig from "../../config/mapConfig.json";

export default function updateSpawnLocations(locationList: ILocation[]) {
  for (let index = 0; index < locationList.length; index++) {
    const map = configLocations[index];

    const limit = mapConfig[map].spawnMinDistance;

    // console.log("\n" + map);
    locationList[index].base.SpawnPointParams.forEach(
      (
        { ColliderParams, BotZoneName, DelayToCanSpawnSec, Categories, Sides },
        innerIndex
      ) => {
        if (
          ColliderParams?._props?.Radius !== undefined &&
          ColliderParams?._props?.Radius < limit &&
          !BotZoneName?.toLowerCase().includes("snipe") &&
          DelayToCanSpawnSec < 300
        ) {
          // console.log(
          //   "----",
          //   ColliderParams._props.Radius,
          //   "=>",
          //   limit,
          //   BotZoneName
          // );

          locationList[index].base.SpawnPointParams[
            innerIndex
          ].ColliderParams._props.Radius = limit;
        }
      }
    );
  }
}
