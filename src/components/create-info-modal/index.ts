import { component, propSync, config, View, watch, autowired } from "@egova/flagwind-web";
import "./index.scss";
import CommonService from "@/services/common-service";
@component({
    template: require("./index.html"),
    components: {}
})
export default class CreateInfoModal extends View {
    @propSync("visible")
    public show!: boolean;

    @autowired(CommonService)
    public commonService!: CommonService;

    // 应用id
    @config({ required: true })
    public applicationId!: string;

    // 模块标识,（针对业务实体分组此处为table）
    @config({ required: true })
    public type!: string;

    // 弹窗标题
    @config({ type: String, default: "" })
    public title!: string;

    // 标题名称
    @config({ type: String, default: "名称" })
    public name!: string;

    // 传进来的model数据
    @config({ type: Object, default: () => Object.create(null) })
    public data!: any;

    public confirmLoading: boolean = false;
    // 分组树
    public treeData: Array<any> = [];

    public replaceFields: any = {
        key: "id",
        value: "id",
        title: "name"
    };

    public formItemLayout = {
        labelCol: { span: 4 },
        wrapperCol: { span: 20 }
    };

    // 规则
    public get rules() {
        return {
            name: [{ required: true, message: "请输入" + this.name, trigger: "blur" }]
        };
    }

    @watch("show", { immediate: true })
    public async watchApplicationId() {
        // 读取分组数据
        this.$refs["form"] && (this.$refs["form"] as any).clearValidate();
        if (this.show && this.applicationId && this.type) {
            // let res = await this.commonService.getCategoryTree(`${this.type}:${this.applicationId}`);
            // if (res && !res.hasError) {
            //     this.treeData = res.result || [];
            // }
        }
    }

    public async onSave() {
        let check = await new Promise((resolve, reject) => {
            (this.$refs["form"] as any).validate((res: boolean, data: any) => {
                resolve(res);
            });
        });
        if (!check) {
            return;
        }
        this.confirmLoading = true;
        this.$emit("on-save", this.data, (success: boolean) => {
            this.confirmLoading = false;
            this.show = !success;
        });
    }
}
