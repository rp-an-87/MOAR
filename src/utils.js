"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.kebabToTitle = exports.getRandomPresetOrCurrentlySelectedPreset = exports.cloneDeep = exports.saveToFile = void 0;
const PresetWeightings_json_1 = __importDefault(require("../config/PresetWeightings.json"));
const Presets_json_1 = __importDefault(require("../config/Presets.json"));
const GlobalValues_1 = require("./GlobalValues");
const saveToFile = (data, filePath) => {
    var fs = require("fs");
    let dir = __dirname;
    let dirArray = dir.split("\\");
    const directory = `${dirArray[dirArray.length - 4]}/${dirArray[dirArray.length - 3]}/${dirArray[dirArray.length - 2]}/`;
    fs.writeFile(directory + filePath, JSON.stringify(data, null, 4), function (err) {
        if (err)
            throw err;
    });
};
exports.saveToFile = saveToFile;
const cloneDeep = (objectToClone) => JSON.parse(JSON.stringify(objectToClone));
exports.cloneDeep = cloneDeep;
const getRandomPresetOrCurrentlySelectedPreset = () => {
    switch (true) {
        case GlobalValues_1.globalValues.forcedPreset.toLowerCase() === "custom":
            return {};
        case !GlobalValues_1.globalValues.forcedPreset:
            GlobalValues_1.globalValues.forcedPreset = "random";
            break;
        case GlobalValues_1.globalValues.forcedPreset === "random":
            break;
        default:
            return Presets_json_1.default[GlobalValues_1.globalValues.forcedPreset];
    }
    const all = [];
    const itemKeys = Object.keys(PresetWeightings_json_1.default);
    for (const key of itemKeys) {
        for (let i = 0; i < PresetWeightings_json_1.default[key]; i++) {
            all.push(key);
        }
    }
    const preset = all[Math.round(Math.random() * (all.length - 1))];
    GlobalValues_1.globalValues.currentPreset = preset;
    return Presets_json_1.default[preset];
};
exports.getRandomPresetOrCurrentlySelectedPreset = getRandomPresetOrCurrentlySelectedPreset;
const kebabToTitle = (str) => str
    .split("-")
    .map((word) => word.slice(0, 1).toUpperCase() + word.slice(1))
    .join(" ");
exports.kebabToTitle = kebabToTitle;
//# sourceMappingURL=utils.js.map