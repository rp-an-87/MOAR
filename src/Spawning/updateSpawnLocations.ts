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

    const InfiltrationList = [
      ...new Set(
        locationList[index].base.SpawnPointParams.filter(
          ({ Infiltration }) => Infiltration
        ).map(({ Infiltration }) => Infiltration)
      ),
    ];

    // console.log(map, InfiltrationList);
    const getRandomInfil = (): string =>
      InfiltrationList[Math.floor(Math.random() * InfiltrationList.length)];
    // console.log(InfiltrationList);
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
          // Make it so players/pmcs can spawn anywhere.
          if (
            config.playerOpenZones &&
            !!Infiltration &&
            (Sides.includes("Pmc") || Sides.includes("All"))
          ) {
            locationList[index].base.SpawnPointParams[innerIndex].Categories = [
              "Player",
              "Coop",
              innerIndex % 2 === 0 ? "Group" : "Opposite",
            ];

            locationList[index].base.SpawnPointParams[innerIndex].Sides = [
              "Pmc",
              "All",
            ];
            // console.log(
            //   BotZoneName || "none",
            //   locationList[index].base.SpawnPointParams[innerIndex].Categories,
            //   locationList[index].base.SpawnPointParams[innerIndex].Sides
            // );
          }
          if (!Infiltration) {
            if (
              !config.allOpenZones &&
              config.pmcOpenZones &&
              Categories.includes("Bot") &&
              Sides[0] === "Savage"
            ) {
              locationList[index].base.SpawnPointParams[innerIndex].Categories =
                ["Player", "Bot"];
            }

            if (config.allOpenZones) {
              locationList[index].base.SpawnPointParams[innerIndex].Categories =
                [
                  "Bot",
                  "Player",
                  "Coop",
                  innerIndex % 2 === 0 ? "Group" : "Opposite",
                ];

              locationList[index].base.SpawnPointParams[
                innerIndex
              ].Infiltration = getRandomInfil();
              // console.log(
              //   locationList[index].base.SpawnPointParams[innerIndex].Infiltration
              // );
              locationList[index].base.SpawnPointParams[innerIndex].Sides = [
                "Pmc",
                "Savage",
                "All",
              ];
            }

            if (config.bossOpenZones && Categories.includes("Bot")) {
              locationList[index].base.SpawnPointParams[
                innerIndex
              ].Categories.push("Boss");
            }
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
              DelayToCanSpawnSec * Math.random() * Math.random() * 0.5
            );

            // console.log(
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
