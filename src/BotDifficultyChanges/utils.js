"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergeDeep = exports.isObject = exports.cloneDeep = void 0;
const cloneDeep = (objectToClone) => JSON.parse(JSON.stringify(objectToClone));
exports.cloneDeep = cloneDeep;
const isObject = (item) => {
    return (item && typeof item === "object" && !Array.isArray(item));
};
exports.isObject = isObject;
const mergeDeep = (target, ...sources) => {
    if (!sources.length)
        return target;
    const source = sources.shift();
    if ((0, exports.isObject)(target) && (0, exports.isObject)(source)) {
        for (const key in source) {
            if ((0, exports.isObject)(source[key])) {
                if (!target[key])
                    Object.assign(target, { [key]: {} });
                (0, exports.mergeDeep)(target[key], source[key]);
            }
            else {
                Object.assign(target, { [key]: source[key] });
            }
        }
    }
    return (0, exports.mergeDeep)(target, ...sources);
};
exports.mergeDeep = mergeDeep;
