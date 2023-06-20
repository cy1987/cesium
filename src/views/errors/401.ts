import { component, View } from "@egova/flagwind-web";
import "./403.scss";

@component({
    template: require("./401.html")
})
export default class Error401View extends View {
    /**
     * 当返回首页按钮点击时调用。
     * @protected
     * @param  {MouseEvent} e 鼠标事件参数。
     * @returns void
     */
    protected onBackHomeClick(e: MouseEvent): void {
        // this.$router.push("login");
        window.location.href = "index.html";
    }

    /**
     * 当返回上一页按钮点击时调用。
     * @protected
     * @param  {MouseEvent} e 鼠标事件参数。
     * @returns void
     */
    protected onBackPrevClick(e: MouseEvent): void {
        this.$router.go(-1);
    }
    protected onLoginout() {
        // 退出登录
        this.$store.commit("user/logout", this);
        this.$store.commit("menu/clearOpenedSubmenu");

        this.$router.push({
            name: "login"
        });
    }
}
