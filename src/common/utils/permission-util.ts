import Cookies from "js-cookie";
import { applicationCode } from "@/settings";
export class PermissionUtil {
    private static permisstionsMap: Map<string, Set<string>> = new Map();
    public static clearPermisstionsMap() {
        this.permisstionsMap.clear();
    }

    public static getPermissions(): Set<string> {
        const userInfo: any = JSON.parse(localStorage.getItem("user") as string);
        if (!userInfo) return new Set([]);
        const { user, applicationPermissions } = userInfo;
        if (!this.permisstionsMap.has(user.id)) {
            if (!!applicationCode) {
                console.warn("applicationCode 为空");
            }
            let permissionList: Array<string> = [];
            for (const i of applicationPermissions || []) {
                if (!applicationCode || i.application?.code === applicationCode) {
                    let appCode = i.application?.code || "";
                    if (!i.resourceMenus) {
                        i.resourceMenus = [];
                    }
                    permissionList = permissionList.concat(i.resourceMenus.map((v: any) => `${appCode}:${v.code}`));
                }
            }
            this.permisstionsMap.set(user.id, new Set(permissionList));
        }
        return this.permisstionsMap.get(user.id) as Set<string>;
    }

    public static async handePermissionBeforeEach(routes: Array<any>, to: any, from: any, next: any) {
        // 如果账号为admin或者进入的菜单schemaId为空（即不需要进行权限控制）直接放行
        if (Cookies.get("username") === "admin" || !(to.meta && to.meta.schemaId)) {
            next();
            return;
        }
        const permissions = this.getPermissions();
        if (permissions.has(to.meta.schemaId)) {
            // 如果有权限
            next();
            return;
        } else if (from.path === "/" || from.path === "/401" || from.path === "/login") {
            // 如果没有即将进入的页面的权限，先进行判断，如果是刚进入 是从/ 路径重定向进入第一个默认页面，而第一个页面刚好没有权限
            // 这时候如果直接重定向到401页面体验会很差，所以这里处理是 如果从 /路径重定向到第一个默认页面，刚好第一个默认页面没有权限，
            // 这个时候去找该用户第一个有权限的页面并进入该页面
            // 如果用户一个权限也没有那么才会进入401,
            // 如果不是从/重定向过来的 如果没有权限 则直接进入401·
            let page = PermissionUtil.getFirstAuthPage(permissions, routes);
            next({ replace: true, name: page });
        } else if (
            new Set((routes[0].children || []).map((v: any) => v.name)).has(
                to.matched.length > 1 && to.matched[1].name
            ) &&
            !this.isSameModel(from, to)
        ) {
            // 前往不同的模块
            const name = to.matched.length > 1 && to.matched[1].name;
            const route = (routes[0].children || []).filter((v: any) => v.name === name);
            let page = PermissionUtil.findFirstAuthPage(route);
            next({
                replace: true,
                name: page
            });
        } else {
            next({
                replace: true,
                name: "401"
            });
        }
    }

    public static isSameModel(from: any, to: any) {
        let fromModel = from.meta?.schemaId?.split(":");
        let toModel = to.meta?.schemaId?.split(":");
        fromModel = fromModel && fromModel.length > 1 ? fromModel[1] : "";
        toModel = toModel && toModel.length > 1 ? toModel[1] : "null";
        return toModel === fromModel;
    }
    public static getFirstAuthPage(permissions: Set<string>, routes: Array<any>) {
        let pages: Array<any> = PermissionUtil.getAllPageList(routes).filter(
            (v: any) => !v.children || (v.children && v.children?.length === 0)
        );
        for (let i = 0; i < pages.length; i++) {
            if (!pages[i].meta || !pages[i].meta.schemaId || permissions.has(pages[i].meta.schemaId)) {
                return pages[i].name;
            }
        }
        return "401";
    }
    public static findFirstAuthPage(routes: Array<any>) {
        let pages: Array<any> = PermissionUtil.getAllPageList(routes).filter(
            (v: any) => !v.children || (v.children && v.children.length === 0)
        );
        const permissions = this.getPermissions();
        for (let i = 0; i < pages.length; i++) {
            if (!pages[i].meta || !pages[i].meta.schemaId || permissions.has(pages[i].meta.schemaId)) {
                return pages[i].name;
            }
        }
        return "401";
    }
    public static getAllPageList(routes: Array<any>): Array<any> {
        let result = [];
        for (let i = 0; i < routes.length; i++) {
            result.push(routes[i]);
            if (routes[i] && routes[i].children && routes[i].children.length > 0) {
                result = result.concat(PermissionUtil.getAllPageList(routes[i].children));
            }
        }
        return result;
    }

    // 头部只显示有权限的模块菜单
    public static handPermissionMenu(menuList: Array<any>) {
        const permissions = this.getPermissions();
        if (Cookies.get("username") === "admin") return menuList;
        return menuList.filter((menu) => {
            return (permissions && permissions.has(menu.meta?.schemaId?.split(":")[1])) || !menu.meta?.schemaId;
        });
    }

    // 根据权限处理菜单
    public static handleMenuByPermissions(menus: Array<any>) {
        let menuList = menus.$clone();
        if (Cookies.get("username") === "admin") {
            return menuList;
        }
        const permissions = this.getPermissions();
        // 先排除一级菜单中 没有权限的单个菜单,schemaId为空的不过滤
        menuList = menuList.filter((menu: any) => !menu.meta.schemaId || permissions.has(menu.meta.schemaId));
        // 排除二级菜单
        menuList.forEach((subMenu: any) => {
            subMenu.children = (subMenu.children || []).filter(
                (page: any) => !page.meta?.schemaId || permissions.has(page.meta.schemaId)
            );
        });
        return menuList;
    }
}
