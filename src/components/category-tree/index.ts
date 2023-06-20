/**
 * @param type: string 模块标识
 * @param title: string 标题
 * @param searchOption: 检索配置
 * @param applicationId: string 应用id
 * @param topIcon: string 一级目录图标
 * @param otherIcon: string 二级及以下目录图标
 * @emit ("on-select", data) 选中分组事件，返回选中的节点信息
 */
import { Category } from "@/models";
import { CommonService } from "@/services";
import { config, component, propSync, Component, autowired, watch } from "@egova/flagwind-web";
import AddCategoryModal from "./add-modal";
import "./index.scss";
import { CategoryTreeService } from "./service";
@component({
    template: require("./index.html"),
    components: {
        "add-category-modal": AddCategoryModal
    }
})
export default class CategoryTree extends Component {
    // 模块标识,（针对业务实体分组此处为table）
    @config({ required: true })
    public type!: string;

    // 标题
    @config({ default: "" })
    public title!: string;

    // 应用id
    @config({ default: () => {} })
    public applicationId!: object;

    // 一级图标
    @config({ default: "micon-folder" })
    public topIcon!: string;

    // 其他图标
    @config({ default: "micon-folder" })
    public otherIcon!: string;

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

    @autowired(CommonService)
    public service!: CommonService;
    // @autowired(CategoryTreeService)
    // public categoryService!: CategoryTreeService;

    public selectedKeys: any = [];

    @watch("applicationId", { immediate: true })
    public async loadData() {
        if (!this.applicationId) {
            return;
        }
        this.selectedKeys = [this.applicationId];
        let node: any = {
            id: this.applicationId,
            name: "全部分组",
            selectable: true,
            isApp: true,
            selected: true
        };
        // let res = await this.service.getCategoryTree(`${this.type}:${node.id}`);
        // if (res && !res.hasError) {
        //     node.children = this.getNode(res.result || []);
        //     this.treeData = [node];
        //     this.generateList(this.treeData);
        //     this.$emit("on-select", node);
        // }
    }

    public showCategoryModal: boolean = false;

    public treeData: Array<any> = [];

    public category: Category = {} as any;

    public menus: any = {
        add: {
            value: "add",
            text: "新增分组",
            handler: this.addCategory
        },
        edit: {
            value: "edit",
            text: "编辑分组",
            handler: this.editCategory
        },
        delete: {
            value: "delete",
            text: "删除分组",
            color: "#f5625f",
            handler: this.deleteCategoty
        }
    };

    public searchValue = "";
    public expandedKeys: any = [];
    public autoExpandParent = false;
    public replaceFields: object = { key: "id" };
    public dataList: any = [];

    public getMenus(isApp: boolean) {
        return isApp ? [this.menus.add] : [this.menus.add, this.menus.edit, this.menus.delete];
    }

    public getNode(list: Array<any>) {
        let res = [];
        for (const i of list) {
            let node: any = {
                ...i,
                isLeaf: !i.children?.length,
                loaded: true,
                children: this.getNode(i.children || [])
            };
            res.push(node);
        }
        return res;
    }

    public onClickMenu({ key }: any, data: any) {
        let { id, isApp, type } = data;
        let appId = isApp ? id : type.split(":").pop();
        this.menus[key].handler({ ...data, appId });
    }

    public addCategory(node: any) {
        let { id, isApp, appId } = node;
        this.category = {
            type: `${this.type}:${appId}`,
            parentId: isApp ? undefined : id,
            name: ""
        };
        this.showCategoryModal = true;
    }

    public editCategory(node: any) {
        this.category = node;
        this.showCategoryModal = true;
    }

    // public async onSave(data: Category) {
    //     await this.service.saveCategory(data);
    //     this.loadData();
    // }

    public deleteCategoty(node: any) {
        let { id, isApp, appId } = node;
        this.category = {
            type: `${this.type}:${appId}`,
            parentId: isApp ? undefined : id,
            name: ""
        };
        this.$confirm({
            title: "确认",
            content: `您确定要删除分组 ${node.name} 吗`,
            okText: "确认",
            cancelText: "取消",
            onOk: async () => {
                // await this.service.deleteCategory(node.id);
                this.loadData();
            }
        });
    }

    public onSelect(
        selectedKeys: Array<string>,
        e: { selected: boolean; selectedNodes: Array<any>; node: any; event: string }
    ) {
        if (!selectedKeys.length) {
            return;
        } else {
            const { dataRef: data } = e?.node || {};
            this.selectedKeys = selectedKeys;
            // 返回当前结点和根结点
            this.$emit("on-select", data);
        }
    }

    public generateList(data: Array<object>) {
        for (let i = 0; i < data.length; i++) {
            const node: any = data[i];
            this.dataList.push({ key: node.id, name: node.name });
            if (node.children) {
                this.generateList(node.children);
            }
        }
    }

    public getParentKey(key: any, tree: any): any {
        let parentKey;
        for (let i = 0; i < tree.length; i++) {
            const node = tree[i];
            if (node.children) {
                if (node.children.some((item: any) => item.id === key)) {
                    parentKey = node.id;
                } else if (this.getParentKey(key, node.children)) {
                    parentKey = this.getParentKey(key, node.children);
                }
            }
        }
        return parentKey;
    }

    public onExpand(expandedKeys: Array<string>) {
        this.expandedKeys = expandedKeys;
        this.autoExpandParent = false;
    }

    public onChange(e: any) {
        const value = e.target.value;
        const expandedKeys = this.dataList
            .map((item: any) => {
                if (item.name.indexOf(value) > -1) {
                    return this.getParentKey(item.key, this.treeData);
                }
                return null;
            })
            .filter((item: any, i: any, self: any) => item && self.indexOf(item) === i);
        this.expandedKeys = expandedKeys;
        this.searchValue = value;
        this.autoExpandParent = true;
    }
}
