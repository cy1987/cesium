import { component, View, config, watch } from "@egova/flagwind-web";
import PubSub from "pubsub-js";
import "./index.scss";

@component({
    template: require("./index.html")
})
export default class ConfirmBox extends View {
    public type: string = "";
    public show: boolean = false;
    public date: any = "";

    public mounted() {
        PubSub.subscribe("energyBox2", (msg, data) => { /* 订阅弹窗事件 */
            if (data === "1") {
                console.log("show")
                this.show = true; /* 显示 */
            } else if (data === "2") {
                this.close();
            }
        });
    }

    public destroyed() { //关闭组件时取消订阅事件
        PubSub.unsubscribe("energyBox2");
    }

    public close() {
        console.log("close")
        this.show = false;
    }

    public search() {
        // 这里写搜索事件

        //PubSub.publish("trafficChart", "888") // 搜索完成后传输数据给图表，第二个参数是需要传输的数据
    }

}
