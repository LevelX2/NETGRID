import { parse, TYPE } from "@formatjs/icu-messageformat-parser";

export function icuParameters(message) {
  const parameters = new Set();
  function visit(elements) {
    for (const element of elements) {
      if (element.type === TYPE.literal || element.type === TYPE.pound)
        continue;
      if (element.type === TYPE.tag) {
        visit(element.children);
        continue;
      }
      parameters.add(element.value);
      if (element.type === TYPE.select || element.type === TYPE.plural) {
        for (const option of Object.values(element.options))
          visit(option.value);
      }
    }
  }
  visit(parse(message));
  return parameters;
}
