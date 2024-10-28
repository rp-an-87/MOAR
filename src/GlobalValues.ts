import { ILocations } from "@spt/models/spt/server/ILocations";
import config from "../config/config.json";

export class globalValues {
  public static baseConfig: typeof config = undefined;
  public static baseLocations: ILocations = undefined;
}
