import { Category } from "@/models";
import { CommonService } from "@/services";
import { config, component, watch, Component, autowired } from "@egova/flagwind-web";
import "./index.scss";
@component({
    template: require("./index.html"),
    components: {}
})
export default class AddCategoryModal extends Component {
    @config({ default: false })
    public value!: boolean;

    @config({ required: true })
    public data!: Category;

    @autowired(CommonService)
    public service!: CommonService;

    public rules:any={
        name: [{ required: true, message: "请输入分组名称", trigger: "blur" }]
    }

    public get show() {
        return this.value;
    }

    public set show(value) {
        this.$emit("input", value);
    }

    public get isEdit() {
        return Boolean(this.data?.id);
    }

    public get title() {
        return this.isEdit ? "编辑分组" : "新增分组";
    }

    @watch("show", { immediate: true })
    public watchShow(){
        this.$refs["form"] && (this.$refs["form"] as any).clearValidate();
    }

    // public async onSave() {
    //     let check = await new Promise((resolve, reject) => {
    //         (this.$refs["form"] as any).validate((res: boolean, data: any) => {
    //             resolve(res);
    //         });
    //     });
    //     if (!check) {
    //         return;
    //     }
    //     let res = await this.service.saveCategory(this.data);
    //     if (res?.hasError) {
    //         return;
    //     }
    //     this.$message.success("保存成功");
    //     this.show = false;
    //     this.$emit("on-saved", this.data);
    // }
}
