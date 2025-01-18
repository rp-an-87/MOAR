import { ILocation } from "@spt/models/eft/common/ILocation";
import _config from "../../config/config.json";
import mapConfig from "../../config/mapConfig.json";
import {
  defaultEscapeTimes,
  defaultHostility,
} from "./constants";
import { buildBotWaves, MapSettings, shuffle } from "./utils";
import { saveToFile } from "../utils";
import getSortedSpawnPointList from "./spawnZoneUtils";

export default function buildPmcs(
  config: typeof _config,
  locationList: ILocation[]
) {
  for (let index = 0; index < locationList.length; index++) {
    const mapSettingsList = Object.keys(mapConfig) as Array<
      keyof typeof mapConfig
    >;
    const map = mapSettingsList[index];

    // Set pmcs hostile to everything
    locationList[index].base.BotLocationModifier.AdditionalHostilitySettings =
      defaultHostility;

    const {
      pmcHotZones = [],
      pmcWaveCount,
    } = (mapConfig?.[map] as MapSettings) || {};

    // let pmcZones = shuffle<string[]>([
    //   ...new Set(
    //     [...locationList[index].base.SpawnPointParams]
    //       .filter(
    //         ({ Categories, BotZoneName }) =>
    //           !!BotZoneName &&
    //           !BotZoneName.includes("snipe") &&
    //           (Categories.includes("Player") || Categories.includes("All")) &&
    //           !BotZoneName.includes("BotZoneGate")
    //       )
    //       .map(({ BotZoneName, ...rest }) => {
    //         return BotZoneName;
    //       })
    //   ), ...pmcHotZones
    // ]);
    const { Position: { x, z } } = locationList[index].base.SpawnPointParams[locationList[index].base.SpawnPointParams.length - 1]

    let pmcZones = getSortedSpawnPointList(locationList[index].base.SpawnPointParams.
      filter(({ Categories, Sides }, index) =>
        index % 2 !== 0 &&
        Categories[0] === 'Bot' &&
        Sides[0] === "Savage"), x, z).
      map(({ BotZoneName }) => BotZoneName)


    if (map === "laboratory") {
      pmcZones = new Array(10).fill(pmcZones).flat(1);
    }

    if (config.allOpenZones) pmcZones = shuffle<string[]>(pmcZones)

    const escapeTimeLimitRatio = Math.round(
      locationList[index].base.EscapeTimeLimit / defaultEscapeTimes[map]
    );

    const totalWaves = Math.round(
      pmcWaveCount * config.pmcWaveQuantity * escapeTimeLimitRatio
    );

    const numberOfZoneless = totalWaves - pmcZones.length;
    if (numberOfZoneless > 0) {
      console.log(`${map} ran out of appropriate zones for pmcs, duplicating zones`)
      // const addEmpty = new Array(numberOfZoneless).fill("");
      pmcZones = [...pmcZones, ...pmcZones]
    }

    if (config.debug) {
      console.log(`${map} PMC count ${totalWaves} \n`);

      escapeTimeLimitRatio !== 1 &&
        console.log(
          `${map} PMC wave count changed from ${pmcWaveCount} to ${totalWaves} due to escapeTimeLimit adjustment`
        );
    }

    const timeLimit = locationList[index].base.EscapeTimeLimit * 60;

    const half = Math.round(
      totalWaves % 2 === 0 ? totalWaves / 2 : (totalWaves + 1) / 2
    );

    const start = Math.random() > 0.5

    const usecSpawns = pmcZones.filter((_, i) => i % 2 === 0)
    const bearSpawns = pmcZones.filter((_, i) => i % 2 !== 0)

    const pmcUSEC = buildBotWaves(
      half,
      config.startingPmcs ? Math.round(0.2 * timeLimit) : timeLimit,
      config.pmcMaxGroupSize - 1,
      config.pmcGroupChance,
      usecSpawns,
      config.pmcDifficulty,
      "pmcUSEC",
      false,
      config.pmcWaveDistribution,
      start ? -1 : 0
    );

    const pmcBEAR = buildBotWaves(
      half,
      config.startingPmcs ? Math.round(0.2 * timeLimit) : timeLimit,
      config.pmcMaxGroupSize - 1,
      config.pmcGroupChance,
      bearSpawns,
      config.pmcDifficulty,
      "pmcBEAR",
      false,
      config.pmcWaveDistribution,
      start ? 15 : -1
    );




    locationList[index].base.BossLocationSpawn = [
      ...pmcUSEC,
      ...pmcBEAR,
      ...locationList[index].base.BossLocationSpawn,
    ];
  }
}
