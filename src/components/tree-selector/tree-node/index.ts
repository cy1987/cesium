import { component, Component, config, watch } from "@egova/flagwind-web";
import "./index.scss";

@component({
    template: require("./index.html")
})
export default class TreeNodeComponent extends Component {
    @config({ default: () => ({}) })
    data!: any;
    @config({ type: Boolean, default: false })
    allowSelectFolder!: boolean;
    onClickNode(e: Event) {
        if (this.isFolder) {
            !this.allowSelectFolder && e.stopPropagation();
        }
        if (this.data.selected) {
            e.stopPropagation();
        }
    }
    get isFolder() {
        return this.data.children && this.data.children.length;
    }
    onClickIcon() {
        this.$set(this.data, "expand", !this.data.expand);
    }
}
