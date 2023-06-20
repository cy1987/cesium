import { component, watch, config, Component } from "@egova/flagwind-web";
import "./index.scss";

export interface CommonListItem {
    name: string;
    selected?: boolean;
    [key: string]: string | boolean | undefined;
}

@component({
    template: require("./index.html"),
    components: {}
})
export default class CommonList extends Component {
    private keyword: string = "";

    private currentIndex: number = -1;

    @config({ type: Array, default: () => [] })
    public data!: Array<CommonListItem>;

    @config({ default: [] })
    public menus!: Array<any>;

    @config({ default: "暂无数据" })
    public emptyTip!: string;

    public list: Array<any> = [];

    public filter(keyword: string = this.keyword) {
        this.list = this.data.filter((v) => v.name.indexOf(keyword) > -1);
        if (!this.list.length) {
            this.currentIndex = -1;
            return;
        }
        this.currentIndex = this.data.findIndex((v) => v._selected) || 0;
        this.currentIndex < 0 && (this.currentIndex = 0);
        this.$emit("on-select", this.list[this.currentIndex]);
    }

    @watch("data", { deep: true, immediate: true })
    private onDataChange() {
        if (Object.prototype.toString.call(this.data) !== "[object Array]") {
            return;
        }
        this.currentIndex = -1;
        this.filter();
    }

    // 下拉菜单选中
    private onClickMenu(menu: any, item: any) {
        this.$emit("on-drop-click", menu, item);
    }

    // 选中某个行
    private onSelect(item: any, index: number) {
        if (this.currentIndex === index) return;
        if (this.currentIndex > -1 && this.currentIndex < this.list.length) {
            this.$set(this.list[this.currentIndex], "_selected", false);
        }
        this.currentIndex = index;
        this.$set(item, "_selected", true);
        this.$emit("on-select", item);
    }
}
