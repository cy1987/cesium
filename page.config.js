const path = require("path");

function resolvePage(page) {
    let pagesConfig = require(path.resolve("./src/pages/index.json"));
    if (!page) return pagesConfig;
    let obj = {};
    obj[page] = pagesConfig[page];
    return obj;
}

let pages = resolvePage(process.env.page);

let skins = require(path.resolve("./public/static/skins/index.json"));

// 修改插件配置
let htmlPlugins = pages ? Object.keys(pages).map(g => "html-" + g) : ["html"];
const plugin = config => {
    htmlPlugins.forEach(v => {
        config.plugin(v).tap(args => {
            if (args[0]) {
                args[0].minify = {
                    removeComments: true,
                    collapseWhitespace: false,
                    removeAttributeQuotes: false
                };
                args[0].skins = skins;
            }
            return args;
        });
    });
};

module.exports = {
    pages: pages,
    plugin: plugin
};
