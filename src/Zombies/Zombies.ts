import { DependencyContainer } from "tsyringe";
import {
  ISeasonalEventConfig,
  ISeasonalEvent,
} from "@spt/models/spt/config/ISeasonalEventConfig.d";

import { ConfigServer } from "@spt/servers/ConfigServer";
import { ConfigTypes } from "@spt/models/enums/ConfigTypes";
import { SeasonalEventService } from "@spt/services/SeasonalEventService";

export const baseZombieSettings = (enabled: boolean, count: number) =>
  ({
    enabled,
    name: "zombies",
    type: "Zombies",
    startDay: "1",
    startMonth: "1",
    endDay: "31",
    endMonth: "12",
    settings: {
      enableSummoning: false,
      removeEntryRequirement: [],
      replaceBotHostility: false,
      zombieSettings: {
        enabled: true,
        mapInfectionAmount: {
          Interchange: count,
          Lighthouse: count,
          RezervBase: count,
          Sandbox: count,
          Shoreline: count,
          TarkovStreets: count,
          Woods: count,
          bigmap: count,
          factory4: count,
          laboratory: count,
        },
        disableBosses: [],
        disableWaves: [],
      },
    },
  } as unknown as ISeasonalEvent);

export const resetCurrentEvents = (
  container: DependencyContainer,
  enabled: boolean,
  zombieWaveQuantity: number
) => {
  const configServer = container.resolve<ConfigServer>("ConfigServer");
  const eventConfig = configServer.getConfig<ISeasonalEventConfig>(
    ConfigTypes.SEASONAL_EVENT
  );

  let percentToShow = Math.round(zombieWaveQuantity * 100);
  if (percentToShow > 100) percentToShow = 100;

  eventConfig.events = [baseZombieSettings(enabled, percentToShow)];

  const seasonalEventService = container.resolve<SeasonalEventService>(
    "SeasonalEventService"
  ) as any;

  // First we need to clear any existing data
  seasonalEventService.currentlyActiveEvents = [];
  seasonalEventService.christmasEventActive = false;
  seasonalEventService.halloweenEventActive = false;

  // Then re-calculate the cached data
  seasonalEventService.cacheActiveEvents();
  // seasonalEventService.addEventBossesToMaps("halloweenzombies");
};

export const setUpZombies = (container: DependencyContainer) => {
  const configServer = container.resolve<ConfigServer>("ConfigServer");
  const eventConfig = configServer.getConfig<ISeasonalEventConfig>(
    ConfigTypes.SEASONAL_EVENT
  );

  eventConfig.events = [baseZombieSettings(false, 100)];

  // eventConfig.eventBossSpawns = {
  //   zombies: eventConfig.eventBossSpawns.halloweenzombies,
  // };
  eventConfig.eventGear[eventConfig.events[0].name] = {};
};
