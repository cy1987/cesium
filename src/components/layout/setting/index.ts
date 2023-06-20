import { component, Component, autowired, config, watch } from "@egova/flagwind-web";
import "./index.scss";
import { PermissionUtil } from "@/common/utils/permission-util";
import { LoginUtil } from "@/common";
import { SkinUtil } from "@/common/utils/skin-utils";
import ImageViewer from "@/components/image-viewer";

import Cookies from "js-cookie";

@component({
    template: require("./index.html"),
    components: {
        "u-image-viewer": ImageViewer
    }
})
export default class Setting extends Component {
    @config({ type: Boolean, default: false })
    public showAdmin!: boolean;

    @config({ type: Boolean, default: true })
    public showUserPop!: boolean;

    public skins: Array<any> = [];
    public skinId: string = "";

    public username: string = "";
    public showEditTeamModal: boolean = false;
    public modalType: string = "add";

    public curTeamId: string = "";
    public teams: Array<any> = [];

    public get user() {
        return this.$store.getters["user/userInfo"];
    }

    public async created() {
        SkinUtil.initSkin();
        this.skins = await SkinUtil.getSkins();
        this.skinId = await SkinUtil.getSkinId();
    }

    public async mounted() {
        this.username = Cookies.get("username") || "";
    }

    // 换肤相关
    @watch("skinId")
    public onSkinChanged() {
        SkinUtil.previewSkin(this.skinId);
    }

    public async logout() {
        await LoginUtil.logout(this);
        PermissionUtil.clearPermisstionsMap();
    }

    public onUser() {
        // 跳转到个人中心
        this.$emit("onSetingClick", "user");
    }

    public onAdmin() {
        // 跳转到后台管理
        this.$emit("onSetingClick", "admin");
    }

    public onIndex() {
        // 跳转到工作台
        this.$emit("onSetingClick", "index");
    }

    public get page() {
        let meta = this.$route.matched && this.$route.matched[0] && this.$route.matched[0].meta;
        return meta && meta.page;
    }

    public loadData() {}

    public onShowEditTeamModal() {
        this.showEditTeamModal = true;
    }

    public onLogout() {
        this.$confirm({
            title: "确认",
            content: "您确定要退出登录吗？",
            onOk: () => {
                this.logout();
            }
        });
    }
}
