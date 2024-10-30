import { DependencyContainer } from "tsyringe";
import { buildWaves } from "../Spawning/Spawning";
import { StaticRouterModService } from "@spt/services/mod/staticRouter/StaticRouterModService";
import { globalValues } from "../GlobalValues";
import { kebabToTitle } from "../utils";

export const setupRoutes = (container: DependencyContainer) => {
  const staticRouterModService = container.resolve<StaticRouterModService>(
    "StaticRouterModService"
  );

  // Make buildwaves run on game end
  staticRouterModService.registerStaticRouter(
    `moarUpdater`,
    [
      {
        url: "/client/match/offline/end",
        action: async (_url, info, sessionId, output) => {
          buildWaves(container);
          return output;
        },
      },
    ],
    "moarUpdater"
  );

  staticRouterModService.registerStaticRouter(
    `moarGetCurrentPreset`,
    [
      {
        url: "/moar/currentPreset",
        action: async () => {
          return `Current Preset: ${kebabToTitle(globalValues.currentPreset)}`;
        },
      },
    ],
    "moarGetCurrentPreset"
  );
};
