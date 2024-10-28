import { DependencyContainer } from "tsyringe";
import { IPostSptLoadMod } from "@spt/models/external/IPostSptLoadMod";
import { IPreSptLoadMod } from "@spt/models/external/IPreSptLoadMod";
import { StaticRouterModService } from "@spt/services/mod/staticRouter/StaticRouterModService";
import { enableBotSpawning } from "../config/config.json";
import { buildWaves } from "./Spawning/Spawning";
import config from "../config/config.json";
import { globalValues } from "./GlobalValues";
import { ILogger } from "@spt/models/spt/utils/ILogger";

class Moar implements IPostSptLoadMod, IPreSptLoadMod {
  postSptLoad(container: DependencyContainer): void {
    if (enableBotSpawning) {
      globalValues.baseConfig = config;
      const logger = container.resolve<ILogger>("WinstonLogger");
      logger.info("\nMOAR: Starting up, may the bots ever be in your favour!");
      enableBotSpawning && buildWaves(container);
    }
  }

  preSptLoad(container: DependencyContainer): void {
    const staticRouterModService = container.resolve<StaticRouterModService>(
      "StaticRouterModService"
    );

    staticRouterModService.registerStaticRouter(
      `MOAR-Updater`,
      [
        {
          url: "/client/match/offline/end",
          action: async (_url, info, sessionId, output) => {
            buildWaves(container);
            return output;
          },
        },
      ],
      "aki"
    );
  }
}

module.exports = { mod: new Moar() };
