export const global = <any>window;

/**
 * 后端地址
 * @type {string}
 */
export const webSetting = {
    ...{
        dataRefreshTime: 5000,
        baseMapHost: "http://192.168.1.19:8035", // 地图地址
        baseModelHost: "http://192.168.1.19:8035/map/icon",
        backendUrl: "http://192.168.1.55:7777",
        //innerWeb: true,
        experimentName: "test123456",
        title: "guobo",
        switchHeight: 2000,
        companyName:"青岛军泰英利电子科技有限公司",
        loginImg: "loginImg",
    },
    innerWeb: false,
    ...global.webSetting
};

export const cachePageList = [];
// 配置项目的rootSchemaId
// export const rootSchemaId = "";
export const applicationCode = "usercenter";
