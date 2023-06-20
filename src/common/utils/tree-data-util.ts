export class TreeDataUtil {
    // 处理公共树结构
    public static handlerTreeData(
        list: Array<any> = [],
        titleName: string,
        detailName: string = "",
        detailTitleName: string = titleName,
        filterEmpty: boolean = false
    ) {
        let arr: Array<any> = [];
        list &&
            list.forEach(v => {
                v.title = v[titleName];
                v.checked = false;
                v.selected = false;
                v.indeterminate = false;
                v.expand = false;
                v.children = TreeDataUtil.handlerTreeData(
                    v.children,
                    titleName,
                    detailName,
                    detailTitleName
                );
                if (detailName) {
                    let tmp = v[detailName];
                    if (tmp) {
                        tmp = tmp.map((item: any) => {
                            item.title = item[detailTitleName];
                            item.checked = false;
                            item.selected = false;
                            item.indeterminate = false;
                            item.parentId = v.id;
                            item.parentName = v.title;
                            return item;
                        });
                        v.children = (v.children || []).concat(tmp);
                    }
                }
                if (!filterEmpty || v.children.length) arr.push(v);
            });
        return arr;
    }

    /**
     * 查找id下的children数据
     * @param data
     * @param id
     * @returns
     */
    public static findChildren(data: Array<any>, id: string): any {
        if (!id) {
            return data;
        }

        let result: Array<any> = [];
        for (let i = 0; i < data.length; i++) {
            if (data[i].id === id) {
                result = data[i].children || [];
                break;
            } else if (data[i].children) {
                result = this.findChildren(data[i].children, id);
                if (result.length) {
                    break;
                }
            }
        }
        return result;
    }
}
