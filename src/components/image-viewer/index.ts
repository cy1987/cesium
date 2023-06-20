import { component, Component, config } from "@egova/flagwind-web";
import Vue from "vue";
import Viewer from "v-viewer";
import "./index.scss";
import "viewerjs/dist/viewer.css";
import directives from "./directives";
Vue.use(<any>Viewer, { name: "viewer" });
@component({
    template: require("./index.html"),
    directives
})
export default class ImageViewer extends Component {
    @config({ type: [Array, String], default: () => [] })
    public images!: Array<any> | any;

    @config({
        type: [ImageData, String],
        // default: () => require("../../assets/images/error.png")
        default: () => require("@/assets/images/viewer/failed.jpg")
    })
    public errorImg!: ImageData | string;

    @config({
        type: [ImageData, String],
        // default: () => require("../../assets/images/loading.gif")
        default: () => require("@/assets/images/viewer/loading.gif")
    })
    public loadingImg!: ImageData | string;

    // 是否显示加载中图片，建议大图片开启
    @config({ type: Boolean, default: false })
    public showLoading!: boolean;

    public get list() {
        if (Object.prototype.toString.call(this.images) === "[object Array]") {
            return this.images;
        }
        if (Object.prototype.toString.call(this.images) === "[object String]") {
            return [this.images || this.errorImg];
        }
        console.error("ImageViewerComponent: 参数错误");
        return [this.errorImg];
    }

    public onHandleError(evt: any) {
        let img = evt.srcElement;
        img.src = this.errorImg;
        img.onerror = null; // 防止闪图
    }
}
