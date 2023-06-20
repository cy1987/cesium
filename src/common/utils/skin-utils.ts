import axios from "axios";
export class SkinUtil {
    private static skinId: string = localStorage.getItem("skinId") || "";
    private static skins: Array<any> = [];
    /*
     * 返回当前主题的id
     */
    public static async getSkinId() {
        if (!localStorage.getItem("skinId")) {
            localStorage.setItem("skinId", "skin-default");
        }
        this.skinId = localStorage.getItem("skinId")!;
        return this.skinId;
    }

    /*
     * 返回主题列表
     */
    public static async getSkins() {
        if (this.skins && this.skins.length) return this.skins;
        this.skins =
            (await axios
                .get("static/skins/index.json")
                .then((res: any) => res.data)) || [];
        return this.skins;
    }

    /*
     * 初始化主题
     */
    public static async initSkin() {
        let skinId = await this.getSkinId();
        this.setSkin(skinId);
    }

    /*
     * 预览主题
     * @param id: 主题的id
     */
    public static previewSkin(id: string) {
        this.setSkin(id);
    }

    /*
     * 保存主题设置
     * @param id: 主题的id
     */
    public static saveSkin(id: string) {
        localStorage.setItem("skinId", id);
        this.setSkin(id);
    }

    private static setSkin(id: string = this.skinId) {
        let links = document.querySelectorAll("link[class='skin']");
        let elements = Array.from(links);
        let target: any = elements.find(
            (g: any) => g.getAttribute("id") === id
        );
        for (let element of elements) {
            element.setAttribute("disabled", "disabled");
        }
        target && target.removeAttribute("disabled");
    }
}
