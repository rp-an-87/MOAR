import { ILocation } from "@spt/models/eft/common/ILocation";
import _config from "../../config/config.json";
import mapConfig from "../../config/mapConfig.json";
import { configLocations } from "./constants";
import { buildZombie } from "./utils";

export default function buildZombieWaves(
  config: typeof _config,
  locationList: ILocation[]
) {
  let { zombieWaveDistribution, zombieWaveQuantity } = config;

  for (let indx = 0; indx < locationList.length; indx++) {
    const location = locationList[indx].base;

    const { zombieWaveCount } = mapConfig?.[configLocations[indx]];

    if (!zombieWaveCount) return;

    const zombieTotalWaveCount = Math.round(
      zombieWaveCount * zombieWaveQuantity
    );

    const zombieWaves = buildZombie(
      zombieTotalWaveCount,
      location.EscapeTimeLimit,
      zombieWaveDistribution,
      100
    );

    location.BossLocationSpawn.push(...zombieWaves);

    // console.log(zombieWaves[0], zombieWaves[7]);
  }
}
