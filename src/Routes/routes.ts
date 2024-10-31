import { DependencyContainer } from "tsyringe";
import { buildWaves } from "../Spawning/Spawning";
import { StaticRouterModService } from "@spt/services/mod/staticRouter/StaticRouterModService";
import { DynamicRouterModService } from "@spt/services/mod/dynamicRouter/DynamicRouterModService";
import { globalValues } from "../GlobalValues";
import { kebabToTitle } from "../utils";
import PresetWeightingsConfig from "../../config/PresetWeightings.json";

export const setupRoutes = (container: DependencyContainer) => {
  const staticRouterModService = container.resolve<StaticRouterModService>(
    "StaticRouterModService"
  );

  const dynamicRouterModService = container.resolve<DynamicRouterModService>(
    "DynamicRouterModService"
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

  // staticRouterModService.registerStaticRouter(
  //   `moarRerollPreset`,
  //   [
  //     {
  //       url: "/moar/rerollPreset",
  //       action: async () => {
  //         buildWaves(container);
  //         return `Current Preset: ${kebabToTitle(globalValues.currentPreset)}`;
  //       },
  //     },
  //   ],
  //   "moarGetCurrentPreset"
  // );

  staticRouterModService.registerStaticRouter(
    `moarGetPresetsList`,
    [
      {
        url: "/moar/getPresets",
        action: async () => {
          let result = [
            ...Object.keys(PresetWeightingsConfig).map((preset) => ({
              name: preset,
              value: kebabToTitle(preset),
            })),
            { name: "Random", value: "" },
          ];
          console.log(result);
          return JSON.stringify(result);
        },
      },
    ],
    "moarGetPresetsList"
  );

  dynamicRouterModService.registerDynamicRouter(
    "moarSetPreset",
    [
      {
        url: "/moar/setPreset",
        action: async (url: string, info, sessionID, output) => {
          console.log(info, output);
          // const splitUrl = url.split("/");
          // const preset = splitUrl[splitUrl.length - 1];
          // buildWaves(container, { forcedPreset: preset });
          return `Current Preset: ${kebabToTitle(globalValues.currentPreset)}`;
        },
      },
    ],
    "moarSetPreset"
  );
};
