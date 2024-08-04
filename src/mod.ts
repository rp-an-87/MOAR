import { DependencyContainer } from "tsyringe";
import { IPostSptLoadMod } from "@spt/models/external/IPostSptLoadMod";
import { enableBotSpawning } from "../config/config.json";
import { buildWaves } from "./Spawning/Spawning";

class Mod implements IPostSptLoadMod {
  postSptLoad(container: DependencyContainer): void {
    enableBotSpawning && buildWaves(container);
  }
}

module.exports = { mod: new Mod() };
