/**
 * 路由信息在此组件根据权限动态加载
 */
import { component, View, watch } from "@egova/flagwind-web";
import "./index.scss";
import { PermissionUtil } from "@/common/utils/permission-util";
import { OverlayScrollbarsComponent } from "overlayscrollbars-vue";
import "overlayscrollbars/css/OverlayScrollbars.css";
import Setting from "./setting";
import { appRouter } from "@/pages/index/routes";
@component({
    template: require("./index.html"),
    components: {
        "overlay-scrollbars": OverlayScrollbarsComponent,
        "u-setting": Setting
    }
})
export default class MainView extends View {
    public menuList: Array<any> = [];

    /*
     * 滚动条插件配置
     * 参考：https://kingsora.github.io/OverlayScrollbars/#!documentation/options
     */
    public options: any = {
        scrollbars: {
            visibility: "auto",
            autoHide: "move",
            autoHideDelay: 300
        }
    };

    /**
     * 过滤菜单, 根据hideInMenu隐藏菜单
     * @param target
     * @param raw
     */
    public filterMenuList(target: Array<any>, raw: Array<any>) {
        raw.forEach((item) => {
            if (!item.meta?.hideInMenu) {
                let tmp = item.$clone();
                if (item.hasOwnProperty("children")) {
                    tmp.children = [];
                    this.filterMenuList(tmp.children, item.children);
                }
                target.push(tmp);
            }
        });
        return target;
    }

    public menuStyle(item: any) {
        const { icon } = item.meta || {};
        if (!icon) return "";
        return {
            backgroundImage: `url(${require(`@/assets/images/icon/${icon}.png`)})`
        };
    }


    public beforeDestroy() {
        PermissionUtil.clearPermisstionsMap(); // 清理权限
    }

    public getHtmlUrl(app: any): string {
        const { origin, pathname } = window.location;
        let arr = pathname.split("/");
        arr.pop();
        let prefix = arr.join("/");
        return `${origin}${prefix}/${app.name}.html`;
    }

    public routeTo(app: any) {
        this.$router.push({
            path: app.path
        });
    }

    public get apps() {
        return appRouter.children;
    }

    @watch("$route", { immediate: true })
    public onWatchPageChanged() {
        let res: any = this.$router?.options?.routes?.[0] || {};
        let pageRoute = res.children.find((r: any) => r.meta.page == this.page);
        let menu = PermissionUtil.handleMenuByPermissions(pageRoute.children);
        this.menuList = this.filterMenuList([], menu);
    }

    public get page() {
        let meta = this.$route.matched && this.$route.matched[1] && this.$route.matched[1].meta;
        return meta && meta.page;
    }

    public onSettingClick(name: string) {
        let href = this.getHtmlUrl({
            name: name
        });
        window.location.href = href;
    }
}
