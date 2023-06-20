import { config, component, propSync, Component, watch } from "@egova/flagwind-web";
import "./index.scss";
@component({
    template: require("./index.html"),
    components: {}
})
export default class DeleteConfirmModal extends Component {
    @propSync("visible")
    public show!: boolean;

    @config({ type: String, default: "" })
    public name!: string;

    @config({ type: String, default: "删除" })
    public title!: string;

    @config({
        type: Object,
        default: () => {
            return {
                tip: "删除应用表单、报表以及数据会一并删除，且无法还原。",
                subTip: "如确定删除，请输入应用名称：",
                emptyTip: "请输入应用名称",
                errorTip: "请输入正确的应用名称"
            };
        }
    })
    public config!: any;

    @watch("show")
    public watchShow() {
        this.confirmName = "";
        this.deleteHelp = "";
    }

    public get okFun() {
        return this.config.handleDeleteOk ? this.config.handleDeleteOk : this.handleDeleteOk;
    }

    public confirmLoading: boolean = false;

    public confirmName: string = "";
    public deleteHelp: string = "";

    public formItemLayout = {
        labelCol: { span: 0 },
        wrapperCol: { span: 24 }
    };

    public async handleDeleteOk() {
        if (!this.confirmName) {
            this.deleteHelp = this.config.emptyTip || "请输入应用名称";
            return;
        }
        if (this.confirmName !== this.name) {
            this.deleteHelp = this.config.errorTip || "请输入正确的应用名称";
            return;
        }
        this.confirmLoading = true;
        this.$emit("success", (success: boolean) => {
            this.confirmLoading = false;
            this.show = !success;
        });
    }
}
