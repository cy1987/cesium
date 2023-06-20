import { component, View, config } from "@egova/flagwind-web";
import { cachePageList } from "@/settings";

import "./index.scss";

@component({
    template: require("./index.html")
})
export default class BlankView extends View {
    public cachePageList: Array<any> = cachePageList;
}
