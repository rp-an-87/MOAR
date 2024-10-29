import { ILogger } from "@spt/models/spt/utils/ILogger";
import PresetWeightings from "../config/PresetWeightings.json";
import Presets from "../config/advanced/Presets.json";
import { LogTextColor } from "@spt/models/spt/logging/LogTextColor";

export const saveToFile = (data, filePath) => {
  var fs = require("fs");
  let dir = __dirname;
  let dirArray = dir.split("\\");
  const directory = `${dirArray[dirArray.length - 4]}/${
    dirArray[dirArray.length - 3]
  }/${dirArray[dirArray.length - 2]}/`;
  fs.writeFile(
    directory + filePath,
    JSON.stringify(data, null, 4),
    function (err) {
      if (err) throw err;
    }
  );
};

export const cloneDeep = (objectToClone: any) =>
  JSON.parse(JSON.stringify(objectToClone));

export const getRandomPreset = (logger: ILogger) => {
  const all = [];

  const itemKeys = Object.keys(PresetWeightings);

  for (const key of itemKeys) {
    for (let i = 0; i < PresetWeightings[key]; i++) {
      all.push(key);
    }
  }

  const preset: string = all[Math.round(Math.random() * (all.length - 1))];
  console.log(
    `[MOAR] Bot preset set to: ${preset.toUpperCase()}`
  );
  return Presets[preset];
};
