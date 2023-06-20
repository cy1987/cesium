/**
 * 通用树，数据源由外部传入
 * @param dataSource: 树的数据
 * @param searchOption: 检索配置
 * @param topIcon: string 一级目录图标
 * @param otherIcon: string 二级及以下目录图标
 * @emit ("on-select", data) 选中分组事件，返回选中的节点信息
 */
import { config, component, Component, watch } from "@egova/flagwind-web";
import "./index.scss";
@component({
    template: require("./index.html"),
    components: {}
})
export default class CommonTree extends Component {
    // 外部传入的树数据
    @config({ type: Array, default: [] })
    public dataSource!: Array<any>;
    // 一级图标
    @config({ default: "micon-folder" })
    public topIcon!: string;
    // 其他图标
    @config({ default: "micon-folder" })
    public otherIcon!: string;

    // 默认选中的节点
    @config({ type: Array, default: () => [] })
    public defaultSelectedKeys!: Array<any>;

    public expandedKeys: Array<any> = [];
    public keyword: string = "";

    // 检索栏配置
    @config({
        default: () => ({
            show: true,
            placeholder: "输入关键词查询"
        })
    })
    public searchOption!:
        | {
              show: boolean; // 是否展示搜索栏
              placeholder?: string;
          }
        | null
        | undefined;

    public replaceFields = {
        children: "children",
        title: "name",
        key: "id"
    };

    public treeData: Array<any> = [];

    @watch("dataSource", { immediate: true })
    public watchDataSource() {
        this.onFilter();
    }

    public onSelect(
        selectedKeys: Array<string>,
        e: { selected: boolean; selectedNodes: Array<any>; node: any; event: string }
    ) {
        const { dataRef: data } = e?.node || {};
        // 返回当前结点
        this.$emit("on-select", data);
    }

    /**
     * 输入关键字对数据进行过滤
     */
    public onFilter() {
        if (!this.keyword) {
            this.treeData = this.dataSource.$clone();
            return;
        }
        this.treeData = this.filterData(this.dataSource.$clone());
    }
    /**
     * 判断一个节点是否是与关键字匹配的叶子节点，或者是包含符合条件的叶子节点的祖先节点
     * @param node
     */
    public match(node: any) {
        if (!node.children || node.children.length === 0) {
            return (node.text || node.name || "").indexOf(this.keyword) !== -1;
        } else {
            let flag = false;
            node.children.forEach((v: any) => {
                flag = this.match(v) ? this.match(v) : flag;
            });
            return flag;
        }
    }
    /**
     * 处理渲染数据，只保留与关键字匹配的叶子节点和其祖先节点
     * @param data
     */
    public filterData(data: Array<any>) {
        if (!data || !Array.isArray(data)) return data;

        let d = data.filter((v) => this.match(v));
        d = d.map((v) => {
            this.expandedKeys.push(v.id);
            if (v.children) {
                v.children = this.filterData(v.children);
            }
            return v;
        });
        return d;
    }
}
