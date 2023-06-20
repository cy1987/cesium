var commonSetting = { // 部署时把commonSetting改成webSetting
    dataRefreshTime: 5000,
    baseMapHost: "http://192.168.1.19:8035", // 地图地址
    baseModelHost: "http://192.168.1.19:8035/map/icon",
    backendUrl: "http://192.168.1.55:7777",
    innerWeb: true,
    experimentName: "test123456",
    title: "弹性云作战",
    switchHeight: 2000,
    companyName:"青岛军泰英利电子科技有限公司",
    loginImg: "loginImg",
};

/**
 * 初始化屏幕分辨率
 */

var screen = {
    designWidth: 1920, // 设计稿屏幕宽度
    designHeight: 1080, // 设计稿屏幕高度
    minHeight: 620, // laptop高度
    resize: function () {
        document.documentElement.style.fontSize = document.documentElement.clientWidth / 19.2 + "px";
    }
};

screen.resize();
addEventListener("resize", screen.resize);
