import { ILocation } from "@spt/models/eft/common/ILocation";
import _config from "../../config/config.json";
import mapConfig from "../../config/mapConfig.json";
import {
  bossesToRemoveFromPool,
  defaultEscapeTimes,
  defaultHostility,
} from "./constants";
import { buildPmcWaves, MapSettings, shuffle } from "./utils";
import { saveToFile } from "../utils";

export default function buildPmcs(
  config: typeof _config,
  locationList: ILocation[]
) {
  for (let index = 0; index < locationList.length; index++) {
    const mapSettingsList = Object.keys(mapConfig) as Array<
      keyof typeof mapConfig
    >;
    const map = mapSettingsList[index];

    locationList[index].base.BotLocationModifier.AdditionalHostilitySettings =
      defaultHostility;

    const { pmcHotZones = [] } = (mapConfig?.[map] as MapSettings) || {};

    let pmcZones = shuffle<string[]>([
      ...new Set(
        [...locationList[index].base.SpawnPointParams]
          .filter(
            ({ Categories, BotZoneName }) =>
              !!BotZoneName &&
              !BotZoneName.includes("snipe") &&
              (Categories.includes("Player") || Categories.includes("All")) &&
              !BotZoneName.includes("BotZoneGate")
          )
          .map(({ BotZoneName, ...rest }) => {
            return BotZoneName;
          })
      ),
    ]);

    // Make labs have only named zones
    if (map === "laboratory") {
      pmcZones = new Array(10).fill(pmcZones).flat(1);
    }

    const { pmcWaveCount } = mapConfig[map];

    const escapeTimeLimitRatio = Math.round(
      locationList[index].base.EscapeTimeLimit / defaultEscapeTimes[map]
    );

    const totalWaves = Math.round(
      pmcWaveCount * config.pmcWaveQuantity * escapeTimeLimitRatio
    );

    const numberOfZoneless = totalWaves - pmcZones.length;
    if (numberOfZoneless > 0) {
      const addEmpty = new Array(numberOfZoneless).fill("");
      pmcZones = shuffle<string[]>([...pmcZones, ...addEmpty]);
    }

    if (config.debug) {
      console.log(`${map} PMC count ${totalWaves} \n`);

      escapeTimeLimitRatio !== 1 &&
        console.log(
          `${map} PMC wave count changed from ${pmcWaveCount} to ${totalWaves} due to escapeTimeLimit adjustment`
        );
    }

    const timeLimit = locationList[index].base.EscapeTimeLimit * 60;

    const waves = buildPmcWaves(
      totalWaves,
      timeLimit,
      config,
      pmcZones,
      pmcHotZones
    );
    
    locationList[index].base.BossLocationSpawn = [
      ...waves,
      ...locationList[index].base.BossLocationSpawn,
    ];
  }
}
