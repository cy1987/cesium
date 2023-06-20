import { MutationTree } from "vuex";
import UserState from "./state";
import { UserInfo } from "@/models";
import Cookies from "js-cookie";
import { applicationCode } from "@/settings";
export function save(state: UserState, userInfo: UserInfo): void {
    state.id = userInfo.user?.id;
    state.name = userInfo.user?.name;
    state.photo = userInfo.user?.photo;
    state.userName = userInfo.user?.username;
    state.detail = userInfo.user;
    state.user = userInfo.user;

    // 用户权限处理
    if (!applicationCode) {
        console.warn("applicationCode 为空");
    }
    let { applicationPermissions } = userInfo || {
        applicationPermissions: []
    };
    if (!applicationPermissions) {
        applicationPermissions = [];
    }
    let menus: Array<string> = [];
    let items: Array<string> = [];
    for (const i of applicationPermissions) {
        if (!applicationCode || i.application?.code === applicationCode) {
            let appCode = i.application?.code || "";
            menus = menus.concat((i.resourceMenus || []).map((v: any) => `${appCode}:${v.code}`));
            items = items.concat((i.resourceItems || []).map((v: any) => `${appCode}:${v.value}`));
        }
    }
    state.permissions.menus = menus;
    state.permissions.items = items;
    state.user.permissions = state.permissions;

    Cookies.set("username", state.userName);
    Cookies.set("personId", userInfo.user?.personId || "");
    if (userInfo.access_token) {
        Cookies.set("access_token", userInfo.access_token, {
            expires: userInfo.expires_in
        });
        Cookies.set("sso_access_token", userInfo.access_token, {
            expires: userInfo.expires_in,
            Path: "/sso"
        });
        sessionStorage.setItem("access_token", userInfo.access_token);
        sessionStorage.setItem("sso_access_token", userInfo.access_token);
    }
    localStorage.setItem("user", JSON.stringify(userInfo)); // TODO： 后续删除，
}

export function clear(state: UserState): void {
    state.id = "";
    state.name = "";
    state.photo = "";
    state.userName = "";
    state.detail = {};
    state.user = {};
    state.permissions = {
        menus: [],
        items: []
    };
    Cookies.remove("username");
    Cookies.remove("personId");
    Cookies.remove("access_token");
    localStorage.clear();
}
export function logout(state: UserState): void {
    clear(state);
}
export default <MutationTree<UserState>>{
    save,
    clear,
    logout
};
