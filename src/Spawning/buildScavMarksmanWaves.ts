import { ILocation } from "@spt/models/eft/common/ILocation";
import _config from "../../config/config.json";
import mapConfig from "../../config/mapConfig.json";
import {
  configLocations,
  defaultEscapeTimes,
  defaultHostility,
  originalMapList,
} from "./constants";
import { buildBotWaves, MapSettings, shuffle, waveBuilder } from "./utils";
import { WildSpawnType } from "@spt/models/eft/common/ILocationBase";
import { IBotConfig } from "@spt/models/spt/config/IBotConfig";
import { saveToFile } from "../utils";

export default function buildScavMarksmanWaves(
  config: typeof _config,
  locationList: ILocation[],
  botConfig: IBotConfig
) {
  let {
    maxBotCap,
    scavWaveQuantity,
    scavWaveDistribution,
    sniperMaxGroupSize,
    maxBotPerZone,
    scavMaxGroupSize,
    scavDifficulty,
    sniperGroupChance,
    scavGroupChance
  } = config;

  for (let index = 0; index < locationList.length; index++) {
    const mapSettingsList = Object.keys(mapConfig) as Array<
      keyof typeof mapConfig
    >;
    const map = mapSettingsList[index];

    locationList[index].base.waves = []
    locationList[index].base = {
      ...locationList[index].base,
      ...{
        NewSpawn: false,
        OcculsionCullingEnabled: true,
        OfflineNewSpawn: false,
        OfflineOldSpawn: true,
        OldSpawn: true,
        BotSpawnCountStep: 0,
      },
    };

    locationList[index].base.NonWaveGroupScenario.Enabled = false;
    locationList[index].base["BotStartPlayer"] = 0;
    if (
      locationList[index].base.BotStop <
      locationList[index].base.EscapeTimeLimit * 60
    ) {
      locationList[index].base.BotStop =
        locationList[index].base.EscapeTimeLimit * 60;
    }

    const {
      maxBotPerZoneOverride,
      maxBotCapOverride,
      EscapeTimeLimit,
      scavHotZones = [],
    } = (mapConfig?.[map] as MapSettings) || {};

    // Set per map EscapeTimeLimit
    if (EscapeTimeLimit) {
      locationList[index].base.EscapeTimeLimit = EscapeTimeLimit;
      locationList[index].base.exit_access_time = EscapeTimeLimit + 1;
    }

    // Set default or per map maxBotCap
    if (maxBotCapOverride || maxBotCap) {
      const capToSet = maxBotCapOverride || maxBotCap;
      // console.log(map, capToSet, maxBotCapOverride, maxBotCap);
      locationList[index].base.BotMax = capToSet;
      locationList[index].base.BotMaxPvE = capToSet;
      botConfig.maxBotCap[originalMapList[index]] = capToSet;
    }

    // Adjust botZone quantity
    if (maxBotPerZoneOverride || maxBotPerZone) {
      const BotPerZone = maxBotPerZoneOverride || maxBotPerZone;
      // console.log(map, BotPerZone, maxBotPerZoneOverride, maxBotPerZone);
      locationList[index].base.MaxBotPerZone = BotPerZone;
    }

    const sniperLocations = new Set(
      [...locationList[index].base.SpawnPointParams]
        .filter(
          ({ Categories, DelayToCanSpawnSec, BotZoneName, Sides }) =>
            !Categories.includes("Boss") &&
            Sides[0] === "Savage" &&
            (BotZoneName?.toLowerCase().includes("snipe") ||
              DelayToCanSpawnSec > 40)
        )
        .map(({ BotZoneName }) => BotZoneName || "")
    );


    if (sniperLocations.size) {
      locationList[index].base.MinMaxBots = [
        {
          WildSpawnType: "marksman",
          max: sniperLocations.size * 5,
          min: sniperLocations.size,
        },
      ];
    }

    let scavZones = shuffle<string[]>([
      ...new Set(
        [...locationList[index].base.SpawnPointParams]
          .filter(
            ({ Categories, Sides, BotZoneName }) =>
              !!BotZoneName &&
              Categories.includes("Bot") &&
              (Sides.includes("Savage") || Sides.includes("All"))
          )
          .map(({ BotZoneName }) => BotZoneName)
          .filter((name) => !sniperLocations.has(name))
      ), ...scavHotZones,
    ]);


    const { scavWaveCount } = mapConfig[map];

    const escapeTimeLimitRatio = Math.round(
      locationList[index].base.EscapeTimeLimit / defaultEscapeTimes[map]
    );

    // Scavs
    const scavTotalWaveCount = Math.round(
      scavWaveCount * scavWaveQuantity * escapeTimeLimitRatio
    );

    const numberOfZoneless = scavTotalWaveCount - scavZones.length;

    if (numberOfZoneless > 0) {
      const addEmpty = new Array(numberOfZoneless).fill("");
      scavZones = shuffle<string[]>([...scavZones, ...addEmpty]);
    }

    config.debug &&
      escapeTimeLimitRatio !== 1 &&
      console.log(
        `${map} Scav wave count changed from ${scavWaveCount} to ${scavTotalWaveCount} due to escapeTimeLimit adjustment`
      );

    const timeLimit = locationList[index].base.EscapeTimeLimit * 60;

    const snipers = buildBotWaves(
      sniperLocations.size,
      timeLimit,
      sniperMaxGroupSize,
      sniperGroupChance,
      shuffle([...sniperLocations]),
      0.7,
      WildSpawnType.MARKSMAN,
      true,
      0.3,
      60
    );


    const scavWaves = buildBotWaves(
      scavTotalWaveCount,
      timeLimit,
      scavMaxGroupSize,
      scavGroupChance,
      map === "gzHigh" ? [] : scavZones,
      scavDifficulty,
      WildSpawnType.ASSAULT,
      false,
      scavWaveDistribution,
      0
    );
    // if (map === "laboratory") console.log(snipers, scavWaves)
    locationList[index].base.BossLocationSpawn = [
      ...snipers,
      ...scavWaves,
      ...locationList[index].base.BossLocationSpawn,
    ];
  }
}