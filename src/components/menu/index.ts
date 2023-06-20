/**
 * 侧边栏菜单，支持一级菜单和多级菜单
 */
import { component, Component, config, watch } from "@egova/flagwind-web";
import "./index.scss";
import { OverlayScrollbarsComponent } from "overlayscrollbars-vue";
import "overlayscrollbars/css/OverlayScrollbars.css";
// import { exportMenu } from "./export-menu";
interface MenuGroup {
    name: string; // 菜单名称
    open: boolean; // 是否展开
    icon?: "string"; // 图标
    children: Array<MenuItem>;
}
interface MenuItem {
    name: string;
    // active: boolean; // 是否选中
    routeName: "string";
    icon?: "string"; // 图标
}
@component({
    template: require("./index.html"),
    components: {
        "overlay-scrollbars": OverlayScrollbarsComponent
    }
})
export default class MenuComponent extends Component {
    @config({ type: Array, default: () => [] })
    public menuList!: Array<any>;
    public menus: any = [];
    public collapsed: boolean = false; // 是否折叠

    /*
     * 滚动条插件配置
     * 参考：https://kingsora.github.io/OverlayScrollbars/#!documentation/options
     */
    public options: any = {
        scrollbars: {
            visibility: this.collapsed ? "hidden" : "auto",
            autoHide: "move",
            autoHideDelay: 300
        }
    };
    @watch("menuList", { deep: true, immediate: true })
    public initMenu() {
        this.menus = this.getMenus();
    }
    public getMenus() {
        let list: Array<any> = this.menuList || [];
        let menus: Array<MenuGroup | MenuItem> = [];
        let set = new Set((this.$route.matched || []).map(v => v.name));
        for (let i of list) {
            if (i.meta?.isMenuGroup) {
                let menu: MenuGroup = {
                    name: i.meta?.title || i.title || "",
                    // 展开菜单逻辑
                    open: set.has(i.name),
                    icon: i.meta?.icon || "",
                    children: i.children.map(
                        (v: any): MenuItem => {
                            return {
                                name: v.meta?.title || v.title || "",
                                routeName: v.name,
                                icon: v.meta?.icon || i.meta?.icon
                            };
                        }
                    )
                };
                menus.push(menu);
            } else {
                let menu: MenuItem = {
                    name: i.meta?.title || i.title || "",
                    routeName: i.name,
                    icon: i.meta?.icon
                };
                menus.push(menu);
            }
        }
        return menus;
    }

    public onToggleClick() {
        this.collapsed = !this.collapsed;
    }

    public getGroupStatus(data: any) {
        let set = new Set((this.$route.matched || []).map(v => v.name));
        return (data.children || []).find((v: any) => set.has(v.routeName));
    }

    // public onExport() {
    //     exportMenu(this.menuList);
    // }
}
