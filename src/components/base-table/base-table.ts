import { watch } from "@egova/flagwind-web";
import { component, View } from "@egova/flagwind-web";
// import { assignIn, isEqual } from "lodash-es";
import "./table.scss";

@component({})
export default class BaseTableView extends View {
    // column主键
    public key: string = "id";

    // 数据加载中
    public loading: boolean = false;
    // 表内容
    public dataList: Array<any> = [];
    // 表头
    public columns: Array<any> = [];
    // 分页
    public paging = {
        current: 1,
        pageIndex: 1,
        pageSize: 10,
        total: 0,
        pageSizeOptions: ["10", "20", "30", "40", "100"],
        showTotal: (total: any) => `${total}`,
        showQuickJumper: true,
        showSizeChanger: true,
        showLessItems: true
    };

    // 表格显示选择框
    public rowSelection: any = {
        columnWidth: "60px",
        type: "checkbox",
        selectedRowKeys: [],
        selectedRowAllKeys: new Map(),
        onSelect: this.rowOnSelect,
        onChange: this.rowSelectionChagne,
        onSelectAll: this.rowOnSelectAll
    };

    // 当前页勾选数据
    public rowSelectionChagne(selectedRowKeys: Array<string>) {
        this.rowSelection.selectedRowKeys = selectedRowKeys;
    }

    // 所有页面勾选数据
    public rowOnSelect(record: any, selected: boolean, selectedRows: object, nativeEvent: any) {
        if (selected) {
            this.rowSelection.selectedRowAllKeys.set(record[this.key], record);
        } else {
            this.rowSelection.selectedRowAllKeys.delete(record[this.key]);
        }
    }

    public get dataListKey() {
        return this.dataList.map(g => g[this.key]);
    }

    // 回显勾选项(当列表key改变时)
    @watch("dataListKey", { deep: true })
    public setSelectRow() {
        this.rowSelection.selectedRowKeys = [];
        let self = this;
        this.dataList.forEach((g, index) => {
            if (self.rowSelection.selectedRowAllKeys.get(g[self.key])) {
                self.rowSelection.selectedRowKeys.push(g.id ? g.id : index); // 列表数据里有id会优先用id
            }
        })
    }

    public rowOnSelectAll(selected: any, selectedRows: Array<object>, changeRows: any) {
        if (selectedRows.length) {
            changeRows.map((g: any) => {
                this.rowSelection.selectedRowAllKeys.set(g[this.key], g);
            })
        } else {
            changeRows.map((g: any) => {
                this.rowSelection.selectedRowAllKeys.delete(g[this.key]);
            })
        }
    }


    // 翻页等动作
    public onTableChange(pagination: any, filters: any, sorter: any, { currentDataSource }: any) {
        if (this.paging.current !== pagination.current || this.paging.pageSize !== pagination.pageSize) {
            // 翻页组件发生变化
            this.paging.current = pagination.current;
            this.paging.pageIndex = pagination.current;
            this.paging.pageSize = pagination.pageSize;
            this.doQuery();
        }
    }

    public doQuery() {

    }

    public queryTable() {
        // 需要清空当前选择
        this.rowSelection.selectedRowAllKeys.clear();
        this.doQuery();
    }

}
