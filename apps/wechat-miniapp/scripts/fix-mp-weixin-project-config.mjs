import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const projectConfigPath = resolve("dist/build/mp-weixin/project.config.json");
const config = JSON.parse(readFileSync(projectConfigPath, "utf8"));

config.description = "拾光心理微信小程序本地调试工程";
config.appid = "wxa13f65ead4f96fde";
config.projectname = "拾光心理";
config.compileType = "miniprogram";
config.setting = {
  ...(config.setting || {}),
  urlCheck: false,
  es6: true,
  minified: true,
  postcss: false,
  newFeature: true,
  bigPackageSizeSupport: true
};

if (!config.libVersion) {
  delete config.libVersion;
}

writeFileSync(projectConfigPath, `${JSON.stringify(config, null, 2)}\n`, "utf8");
