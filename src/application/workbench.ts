import flagwind from "@egova/flagwind-core";
import WorkbenchBase = flagwind.WorkbenchBase;
import ApplicationContextBase = flagwind.ApplicationContextBase;
import ApplicationContext from "@/application/context";

import Vue from "vue";
import Router from "vue-router";
import Vuex from "vuex";
// ant design 组件以及中文配置
import AntDesign from "ant-design-vue";
import iView from "view-design";
import "view-design/dist/styles/iview.css";
import zhCN from "ant-design-vue/lib/locale-provider/zh_CN";

import math from "halo-math";
// 导入系统组件
// import components from "@egova/flagwind-web";

import "@/assets/styles/index.scss";
import { PermissionUtil } from "@/common/utils/permission-util";
import { LoginUtil } from "@/common";
import TreeSelectorComponent from "@/components/tree-selector";
import VueClipboard from 'vue-clipboard2';
import VueFullscreen from "vue-fullscreen";
import Clipboard from "v-clipboard";
import VueLazyload from "vue-lazyload";
import axios from "axios";
import VJsonEdit from 'v-json-edit'
import "@/assets/styles/fonts/font.scss";


/**
 * 提供工作台的基本封装。
 * @class
 * @version 1.0.0
 */
export default class Workbench extends WorkbenchBase {
    private _workspace: Vue | undefined;

    /**
     * 获取当前应用的主工作空间。
     * @property
     * @returns Workspace
     */
    public get workspace(): Vue | undefined {
        return this._workspace;
    }

    /**
     * 初始化工作台的新实例。
     * @param  {ApplicationContextBase} applicationContext
     */
    public constructor(context: ApplicationContextBase) {
        super(context);
    }

    /**
     * 当工作台打开时调用。
     * @async
     * @protected
     * @virtual
     * @param  {Array<string>} args
     * @returns void
     */
    protected async onOpen(args: Array<string>): Promise<void> {
        let context = this.applicationContext as unknown as ApplicationContext;

        // 初始化路由程序
        this.initializeRouter(context);

        // 初始化状态管理程序
        this.initializeStore(context);

        // 初始化自定义指令
        this.initializeDirective(context);

        this.initializeAxios(context);
        // 初始化组件
        this.initializeComponent(context);
        // 初始化工作空间
        // this._workspace = this.createWorkspace();
        this._workspace = this.createWorkspace(context);
    }

    protected initializeAxios(context: ApplicationContext) {
        // Axios请求拦截器，随着业务的复杂，Axios层的使用将会越来越复杂，写个精简版的就行了。
        axios.interceptors.request.use(
            config => {
                let token = localStorage.getItem("user");
                if (token && config.url && (config.url.indexOf("unity") >= 0 || config.url.indexOf("/token/revoke") >= 0)) {
                    // 判断是否存在token，如果存在的话，则每个http header都加上token
                    config.headers.Authorization = "Bearer " + token;
                }
                return config;
            },
            error => {
                console.error(error);
                return Promise.reject(error);
            }
        );

        axios.interceptors.response.use(
            res => {
                // Do something with response data
                return res;
            },
            e => {
                // Do something with response error
                if (e.response && e.response.data) {
                    let data = e.response.data;
                    if (
                        data.error === "invalid_token" ||
                        data.error === "unauthorized" ||
                        e.response.status === 401
                    ) {
                        localStorage.removeItem("user");

                        // if(localStorage.user){
                        // }
                        
                        context.router.push({ name: "login" });
                        return;
                    }
                }
                return Promise.reject(e);
            }
        );
    }

    /**
     * 创建一个工作空间对象。
     * @override
     * @returns IWorkspace
     */
    protected createWorkspace(context: ApplicationContext): Vue {
        let router = context.router;
        let store = context.store;
        let locale = zhCN;

        return new Vue({
            el: "#app",
            router: router,
            store: store,
            data: {
                locale
            },
            // template: '<div id="app"><router-view /></div>'
            // ant design 中文语言配置
            template: '<a-config-provider :locale="locale"><div id="app"><router-view /></div> </a-config-provider>'
        }).$mount("#app");
    }

    /**
     * 初始化全局组件。
     * @param  {ApplicationContext} context 应用程序上下文实例。
     * @returns void
     */
    private initializeComponent(context: ApplicationContext): void {
        // 注册系统组件
        Vue.use(AntDesign);
        Vue.use(math);
        Vue.use(VueFullscreen);
        // Vue.component("draggable", Draggable);
        Vue.use(VueClipboard);
        Vue.use(Clipboard);
        Vue.use(iView);
        Vue.component("g-select-tree", TreeSelectorComponent);
        Vue.use(VueLazyload, {
            loading: require("@/assets/images/viewer/loading.gif"),
            error: require("@/assets/images/viewer/failed.jpg")
        });
        Vue.use(VJsonEdit)
    }

    /**
     * 初始化路由程序。
     * @param  {ApplicationContext} context 应用程序上下文实例。
     * @returns void
     */
    private initializeRouter(context: ApplicationContext): void {
        // 注册路由组件
        Vue.use(Router);

        // 多次点击同一路由报错
        const originalPush = Router.prototype.push;
        Router.prototype.push = function push(location: any) {
            return (<any>originalPush.call(this, location)).catch((err: any) => err);
        };
        // 初始化路由程序
        let router = new Router(context.routerOptions);

        router.beforeEach(async (to: any, from: any, next: any) => {
            let title = to.meta?.title || "登录";
            window.document.title = title;
            await this.toPage(context, to, from, next);
        });

        // 设置路由程序
        context.router = router;
    }

    private async toPage(context: any, to: any, from: any, next: any) {
        /***
         * 不需要登录的路由控制逻辑
         */

        // // 1.如果是登录页面，先清除之前登录的标记 ，再进入登录页面跳转流程
        // if (to.name === "login") {
        //     window.document.title = "登录页";
        //     // 清除之前登录的标记
        //     LoginUtil.clearLoginFlag();
        //     // 进入登录页面跳转流程
        //     LoginUtil.gotoLogin(to, next);
        //     return;
        // }

        // /***
        //  * 需要登录的路由控制逻辑
        //  */

        // // 2.如果没有token,则跳转至登录页面
        // if (!LoginUtil.hasToken()) {
        //     window.document.title = "登录页";
        //     LoginUtil.gotoLogin(to, next);
        //     return;
        // }

        // // 2.加载用户相关数据(此处token肯定存在)
        // let flag = await LoginUtil.loadUserData(context.store);

        // console.log("加载用户与权限数据状态:" + flag);

        // if (!flag) {
        //     // 用户数据加载失败，说明token失效或者其他问题，请重新登录
        //     // 清除之前登录的标记
        //     LoginUtil.clearLoginFlag();
        //     // 进入登录页面跳转流程
        //     LoginUtil.gotoLogin(to, next);
        //     return;
        // }

        // // 3.如果上一步失败，则把token作废并跳转至登录页面
        // if (!LoginUtil.isLogin()) {
        //     window.alert("获取用户信息异常,如果sso登录，请确实是否实现了token exchange逻辑！");
        //     // await LoginUtil.revokeToken();
        //     // window.document.title = "登录页";
        //     // LoginUtil.gotoLogin(to, next);
        //     return;
        // }
        PermissionUtil.handePermissionBeforeEach(
            [context.routerOptions.routes!.find((r: any) => r.name === "main")],
            to,
            from,
            next
        );
    }

    /**
     * 初始化状态管理程序。
     * @param  {ApplicationContext} context 应用程序上下文实例。
     * @returns void
     */
    private initializeStore(context: ApplicationContext): void {
        // 注册状态管理程序
        Vue.use(Vuex);

        // 初始化状态容器
        let store = new Vuex.Store(context.storeOptions);

        // 设置状态容器
        context.store = store;
    }

    /**
     * 初始化自定义指令。
     * @param  {ApplicationContext} context 应用程序上下文实例。
     * @returns void
     */
    private initializeDirective(context: ApplicationContext): void {
        // for (const [key, value] of Object.entries(directiveObj)) {
        //     Vue.directive(key.replace(/([A-Z])/g, "-$1").toLowerCase(), value);
        // }
    }
}
