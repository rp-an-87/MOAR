import { ILocation } from "@spt/models/eft/common/ILocation";
import { configLocations } from "./constants";
import mapConfig from "../../config/mapConfig.json";
import _config from "../../config/config.json";

export default function updateSpawnLocations(
  locationList: ILocation[],
  config: typeof _config
) {
  for (let index = 0; index < locationList.length; index++) {
    const map = configLocations[index];
    // console.log(map);
    const limit = mapConfig[map].spawnMinDistance;

    // console.log("\n" + map);
    locationList[index].base.SpawnPointParams.forEach(
      (
        {
          ColliderParams,
          BotZoneName,
          DelayToCanSpawnSec,
          Categories,
          Sides,
          Infiltration,
        },
        innerIndex
      ) => {
        if (
          !Categories.includes("Boss") &&
          !BotZoneName?.toLowerCase().includes("snipe") &&
          DelayToCanSpawnSec < 41
        ) {
          // Make it so players can spawn anywhere.
          if (
            config.playerOpenZones &&
            !!Infiltration &&
            (Sides.includes("Pmc") || Sides.includes("All")) &&
            Categories.length === 1 &&
            Categories[0] === "Player"
          ) {
            locationList[index].base.SpawnPointParams[innerIndex].Categories = [
              "Player",
              "Coop",
              innerIndex % 2 === 0 ? "Group" : "Opposite",
            ];

            // console.log(
            //   BotZoneName || "none",
            //   locationList[index].base.SpawnPointParams[innerIndex].Categories,
            //   locationList[index].base.SpawnPointParams[innerIndex].Sides
            // );
          }

          if (
            config.pmcOpenZones &&
            Categories.includes("Bot") &&
            Sides[0] === "Savage" &&
            !Infiltration
          ) {
            locationList[index].base.SpawnPointParams[innerIndex].Categories = [
              "Player",
              "Bot",
            ];
          }

          if (!Infiltration && config.allOpenZones) {
            locationList[index].base.SpawnPointParams[innerIndex].Categories = [
              "Bot",
              "Player",
              "Coop",
              innerIndex % 2 === 0 ? "Group" : "Opposite",
            ];
            locationList[index].base.SpawnPointParams[innerIndex].Sides = [
              "All",
            ];
          }

          if (
            ColliderParams?._props?.Radius !== undefined &&
            ColliderParams?._props?.Radius < limit
          ) {
            locationList[index].base.SpawnPointParams[
              innerIndex
            ].ColliderParams._props.Radius = limit;
          }
        } else {
          if (!Categories.includes("Boss") && DelayToCanSpawnSec > 40) {
            locationList[index].base.SpawnPointParams[
              innerIndex
            ].DelayToCanSpawnSec = Math.round(
              DelayToCanSpawnSec * Math.random() * Math.random()
            );
            // console.log(
            //   count,
            //   BotZoneName,
            //   DelayToCanSpawnSec,
            //   locationList[index].base.SpawnPointParams[innerIndex]
            //     .DelayToCanSpawnSec
            // );
          }
        }
      }
    );
  }
}
