import { autowired } from "@egova/flagwind-web";

import { CommonService } from "@/services";
import { webSetting } from "@/settings";
import Cookies from "js-cookie";
import { getQueryString } from "./tools";

/**
 * 登录工具类
 *
 * @export
 * @class TagUtil
 */
export class LoginUtil {
    @autowired(CommonService)
    private static service: CommonService;

    /**
     * 有没有用户数据
     * @param store
     * @returns
     */
    public static hasUserData(store: any): boolean {
        let user = store?.state.user;
        // 如果状态管理中的username不为空，说明已经加载过当前用户的相关信息
        return !!user?.username;
    }

    public static async getTockenByCode(code: string): Promise<any> {
        return this.service.getTockenByCode(code);
    }

    /**
     * 通过code获取token
     * @param code
     */
    public static async exchangeToken(code: string, type: string | null = null): Promise<any> {
        let casType = type || Cookies.get("cas-type") || localStorage.getItem("cas-type");
        return this.service.exchangeToken(code, casType || "egova");
    }

    // 获取sso认证地址
    public static async getAuthorizeUrl(type: string | null = null): Promise<any> {
        let casType = type || Cookies.get("cas-type") || localStorage.getItem("cas-type");
        return this.service.getAuthorizeUrl(casType || "egova");
    }

    /**
     * 退出并返回登录页面
     * @param vm
     */
    public static async logout(vm: any) {
        // 使当前token失败，
        await this.revokeToken();
        // 清除保存在state里面的用户数据
        if (vm.$store && vm.$store.hasModule("user")) {
            vm.$store.commit("user/clear", this);
        }
        localStorage.removeItem("user");
        if ((window as any).__POWERED_BY_QIANKUN__) {
            window.location.href = webSetting.siteName + "/index.html#/login";
            return;
        }
        if (vm && vm.$router) {
            // 跳转至登录页面
            vm.$router.push({
                name: "login",
                params: {
                    loginType: this.enableSSO() ? "sso" : "self"
                }
            });
            return;
        }

        // 回到默认页面，会自己再跳转到登录页面
        window.location.href = webSetting.siteName + "/index.html#/login";
    }

    /**
     * 加载用户数据
     * @param store
     * @returns
     */
    public static async loadUserData(store: any) {
        // 如果开启了sso，则通过sso的token来加载用户信息
        if (this.enableSSO()) {
            // 从 query string 中读取回退返回的sso token
            let token = this.getSsoToken();
            if (!token) {
                console.warn("sso token 为 null,不能获取用户数据");
                return true;
            }
            try {
                // 通过 sso token 来交换成本地token
                let res = await this.service.exchangeToken(token);
                if (res.data) {
                    // 保存用户信息至 state
                    store?.commit("user/save", res.data);
                    // document.location.search = removeQueryString("token");
                    if (store.hasModule("global")) {
                        store.dispatch("global/setGlobalState", {
                            user: res.data
                        });
                    }
                }
                return true;
            } catch (error) {
                console.error(error);
            }
        } else {
            // 否则走本地用户信息加载逻辑
            let token = this.getToken();
            if (!token) {
                console.warn("token 为 null,不能获取用户数据");
                return false;
            }
            try {
                // 通过本地的token获取用户信息
                let res = await this.service.getUserDetails();
                if (res.data) {
                    // 保存用户信息至 state
                    store.commit("user/save", res.data.result);
                    if (store.hasModule("global")) {
                        store.dispatch("global/setGlobalState", {
                            user: res.data.result
                        });
                    }
                }
                return true;
            } catch (error) {
                console.error(error);
            }
        }
        return false;
    }

    /**
     * 清除登录标记
     */
    public static clearLoginFlag(): void {
        Cookies.remove("username");
        Cookies.remove("access_token");
        localStorage.clear();
    }

    /**
     * 跳转至登录页面
     * @param to 跳转路由
     * @param next
     * @returns
     */
    public static gotoLogin(to: any, next: any) {
        if (to.name === "login") {
            // 如果登录类型强制指定为self,则跳转系统内部登录
            next();
            return;
        } else {
            // 如果路由是从别的页面跳转到登录页面，则再
            next({
                name: "login",
                params: {
                    loginType: this.enableSSO() ? "sso" : "self"
                }
            });
            return;
        }
    }

    /**
     * 是否启用了sso登录
     * @returns
     */
    public static enableSSO() {
        return !!webSetting.casUrl;
    }

    /**
     * 获取sso的token
     * @returns
     */
    public static getSsoToken() {
        let token: any =
            getQueryString("token") || Cookies.get("sso_access_token") || localStorage.getItem("sso_access_token");
        return token;
    }

    /**
     * 使token失效
     */
    public static async revokeToken() {
        let value = this.getToken();
        if (this.enableSSO() && !value) {
            value = this.getSsoToken() || "";
        }
        if (value) {
            try {
                // 调用后端的退出逻辑
                await this.service.logout(value);
            } catch (error) {
                console.log(error);
            }
        }
        this.clearLoginFlag();
    }

    /**
     * 是否登录
     */
    public static isLogin(): boolean {
        let value = Cookies.get("username") || localStorage.getItem("username") || "";
        return value.length > 0;
    }

    /**
     * 判断是否有本地的token和sso的token,只要有一个即可满足
     * @returns
     */
    public static hasToken(): boolean {
        let value = this.getToken();
        if (this.enableSSO() && !value) {
            value = this.getSsoToken() || "";
        }
        return value.length > 0;
    }

    public static saveToken(token: string) {
        if (!token) {
            sessionStorage.setItem("access_token", token);
            localStorage.setItem("access_token", token);
            Cookies.set("access_token", token);
        }
    }

    public static getToken() {
        let token = Cookies.get("access_token") || localStorage.getItem("access_token") || "";
        return token;
    }

    public static saveTeamId(teamId: string) {
        sessionStorage.setItem("teamId", teamId);
        localStorage.setItem("teamId", teamId);
        Cookies.set("teamId", teamId);
    }

    public static getTeamId() {
        let teamId = Cookies.get("teamId") || localStorage.getItem("teamId") || "";
        return teamId;
    }
}
