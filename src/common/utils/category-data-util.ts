export class CategoryDataUtil {
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
                v.expand = false;
                v.checked = false;
                v.selected = false;
                v.indeterminate = false;
                v.children = CategoryDataUtil.handlerTreeData(
                    v.children,
                    titleName,
                    detailName,
                    detailTitleName
                ).filter(c => !c.isDetail);
                if (detailName) {
                    let tmp = v[detailName];
                    if (tmp) {
                        tmp = tmp.map((item: any) => {
                            item.title = item[detailTitleName];
                            item.expand = false;
                            item.isDetail = true;
                            item.checked = false;
                            item.selected = false;
                            item.indeterminate = false;
                            item.parentId = v.id;
                            return item;
                        });
                        v.children = (v.children || []).concat(tmp);
                    }
                }
                if (!filterEmpty || v.children.length) arr.push(v);
            });
        return arr;
    }
    public static handlerCascaderData(
        list: Array<any> = [],
        labelField: string,
        valueField: string
    ) {
        let arr: Array<any> = [];
        list &&
            list.forEach(v => {
                v.label = v[labelField];
                v.value = v[valueField];
                v.children = CategoryDataUtil.handlerTreeData(
                    v.children,
                    labelField,
                    valueField
                );
                arr.push(v);
            });
        return arr;
    }
}
