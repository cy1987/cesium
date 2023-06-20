import { TreeDataUtil } from "@/common/utils/tree-data-util";
import { component, Component, config, watch } from "@egova/flagwind-web";
import "./index.scss";
import TreeNodeComponent from "./tree-node";
@component({
    template: require("./index.html"),
    components: {}
})
export default class TreeSelectorComponent extends Component {
    @config({ type: String, default: "" })
    public value!: string; // 双向绑定

    @config({ type: Array, default: () => [] })
    public treeData!: Array<any>;

    @config({ default: "children" })
    public leafName!: string;
    @config({ type: Boolean, default: false })
    public filterEmpty!: boolean;
    @config({ type: Boolean, default: false })
    allowSelectFolder!: boolean;
    public tree: Array<any> = []; // iview tree使用的数据
    public inputValue: string = "";
    public visible: boolean = false;
    public current: any = {};
    @watch("value", { immediate: true })
    public onValueChange(nv: string) {
        if (!nv) {
            this.inputValue = "";
            this.current = {};
            return;
        }
        let node = this.getNodeById(this.value, this.tree) || {};
        // this.$set(node, "selected", true);
        this.current = node;
        this.inputValue = node.name || "";
    }

    public renderContent(h: any, { root, node, data }: any) {
        this.$set(data, "selected", this.current.id === data.id);
        return h(TreeNodeComponent, {
            props: {
                data,
                allowSelectFolder: this.allowSelectFolder
            }
        });
    }

    @watch("treeData", { deep: false })
    public onTreeDataChange() {
        this.tree = TreeDataUtil.handlerTreeData(
            this.treeData.$clone(),
            "name",
            this.leafName,
            undefined,
            this.filterEmpty
        );
        this.onValueChange(this.value);
    }

    public getNodeById(id: string, nodes: Array<any>): any {
        let node: any = undefined;
        for (let i of nodes) {
            if (i.id === id) return i;
            if (i.children && i.children.length) {
                node = this.getNodeById(id, i.children);
                if (node) return node;
            }
        }
        return undefined;
    }

    public onInputChange() {
        this.visible = true;
    }

    public onSelectChange(selection: Array<any>, node: any) {
        this.$emit("input", node.id);
        this.$emit("on-select", node);
        this.visible = false;
    }

    public onClear() {
        this.$emit("input", "");
        this.$emit("on-select", {});
    }
}
