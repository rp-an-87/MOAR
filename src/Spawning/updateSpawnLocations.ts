import { ILocation } from "@spt/models/eft/common/ILocation";
import { originalMapList } from "./constants";

export default function updateSpawnLocations(locationList: ILocation[]) {
  for (let index = 0; index < locationList.length; index++) {
    const map = originalMapList[index];

    // if (index !== 1 && index !== 2) {
    let limit = 50;
    switch (map) {
      case "factory4_day":
      case "laboratory":
      case "factory4_night":
        limit = 20;
        break;
      case "bigmap":

      case "sandbox_high":
      case "sandbox":
        limit = 30;
        break;

      default:
        limit = 40;
        break;
    }
    // console.log("\n" + map);
    locationList[index].base.SpawnPointParams.forEach(
      ({ ColliderParams, BotZoneName }, innerIndex) => {
        if (
          ColliderParams?._props?.Radius !== undefined &&
          ColliderParams?._props?.Radius < limit
        ) {
        //   console.log(ColliderParams._props.Radius, "=>", limit, BotZoneName);
          locationList[index].base.SpawnPointParams[
            innerIndex
          ].ColliderParams._props.Radius = limit;
        }
      }
    );
    // }
  }
}
