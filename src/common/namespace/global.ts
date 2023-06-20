// 全局变量
export namespace Global {

    /**
     * 公共地图库
     */
    export const cmap = (function () {
        const maps: Map<string, any> = new Map();
        return {
            "has": function(id: string) {
                return id && document.getElementById(id) && maps.has(id);
            },
            "get": function(id: string) {
                return id && maps.get(id);
            },
            "set": function(id: string, map: any) {
                return id && maps.set(id, map) && this;
            }
        };
    })();

}

if (!(<any>window)["Global"]) {
    (<any>window)["Global"] = Global;
}