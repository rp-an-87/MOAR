import { DependencyContainer } from "tsyringe";
import { IPostSptLoadMod } from "@spt/models/external/IPostSptLoadMod";
import { IPostDBLoadMod } from "@spt/models/external/IPostDBLoadMod";
import { IPreSptLoadMod } from "@spt/models/external/IPreSptLoadMod";
import { enableBotSpawning } from "../config/config.json";
import { buildWaves } from "./Spawning/Spawning";
import config from "../config/config.json";
import { globalValues } from "./GlobalValues";
import { ILogger } from "@spt/models/spt/utils/ILogger";
import { setupRoutes } from "./Routes/routes";
import checkPresetLogic from "./Tests/checkPresets";
import { setupSpawns } from "./SpawnZoneChanges/setupSpawn";
import { saveToFile } from "./utils";

class Moar implements IPostSptLoadMod, IPreSptLoadMod, IPostDBLoadMod {
  preSptLoad(container: DependencyContainer): void {
    if (enableBotSpawning) {
      setupRoutes(container);

      // const hash = {}

      // for (const key in BotSpawns) {
      //   const spawns: {
      //     MapName: string, Zones: Record<string, {
      //       "x": number;
      //       "y": number;
      //       "z": number;
      //     }[]>
      //   } = BotSpawns[key]


      //   hash[spawns.MapName] = Object.values(spawns.Zones).flat(1)

      // }
      // saveToFile(hash, "./botSpawns.json")
    }
  }

  postDBLoad(container: DependencyContainer): void {
    if (enableBotSpawning) {
      setupSpawns(container);
    }
  }

  postSptLoad(container: DependencyContainer): void {
    if (enableBotSpawning) {
      checkPresetLogic(container);
      globalValues.baseConfig = config;
      globalValues.overrideConfig = {};
      const logger = container.resolve<ILogger>("WinstonLogger");
      logger.info("\n[MOAR]: Starting up, may the bots ever be in your favour!");
      buildWaves(container);
    }
  }
}

module.exports = { mod: new Moar() };
