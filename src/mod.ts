import { DependencyContainer } from "tsyringe";
import { IPostSptLoadMod } from "@spt/models/external/IPostSptLoadMod";
import { IPreSptLoadMod } from "@spt/models/external/IPreSptLoadMod";
import { IPostDBLoadMod } from "@spt/models/external/IPostDBLoadMod";
import { enableBotSpawning } from "../config/config.json";
import { buildWaves } from "./Spawning/Spawning";
import config from "../config/config.json";
import { globalValues } from "./GlobalValues";
import { ILogger } from "@spt/models/spt/utils/ILogger";
import { setupRoutes } from "./Routes/routes";
import { setUpZombies } from "./Zombies/Zombies";
import checkPresetLogic from "./Tests/checkPresets";

class Moar implements IPostSptLoadMod, IPreSptLoadMod, IPostDBLoadMod {
  postDBLoad(container: DependencyContainer): void {
    // setUpZombies(container);
  }

  preSptLoad(container: DependencyContainer): void {
    if (enableBotSpawning) setupRoutes(container);
  }

  postSptLoad(container: DependencyContainer): void {
    if (enableBotSpawning) {
      checkPresetLogic(container);
      setUpZombies(container);
      globalValues.baseConfig = config;
      globalValues.overrideConfig = {};
      // adjustSpawnPoints(container);
      const logger = container.resolve<ILogger>("WinstonLogger");
      logger.info("\nMOAR: Starting up, may the bots ever be in your favour!");

      buildWaves(container);
    }
  }
}

module.exports = { mod: new Moar() };
