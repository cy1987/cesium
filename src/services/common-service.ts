import ServiceBase from "./service-base";
import { service } from "@egova/flagwind-web";
import Cookies from "js-cookie";
// tslint:disable-next-line:no-implicit-dependencies
import JSEncrypt from "jsencrypt";
import { webSetting } from "@/settings";
import axios, { AxiosResponse } from "axios";
import { serviceHandler } from "@/decorators";

export default class CommonService extends ServiceBase {
    public getUrl(url: string) {
        return webSetting.backendUrl + url;
    }
    // /**
    //  * 登录
    //  * @param username
    //  * @param password
    //  */
    public async login(username: string, password: string): Promise<any> {
        // let publicKey = await this.getPublicKey();
        return this._post<any>(`${webSetting.backendUrl}/oauth/extras/token`, {
            client_id: "unity-client",
            client_secret: "unity",
            grant_type: "password",
            // password: this.encryptData(password, publicKey),
            password: password,
            username: username
        });
    }

    public encryptData(password: string, publicKey: string): string {
        if (!publicKey) {
            publicKey = Cookies.get("public-key") || "";
        }
        if (publicKey === "none" || !publicKey) {
            return password;
        }
        let encryptor = new JSEncrypt(); // 新建JSEncrypt对象
        encryptor.setPublicKey(publicKey); // 设置公钥
        return encryptor.encrypt(password);
    }

    // public async login(username: string, password: string): Promise<any> {
    //     let publicKey = await this.getPublicKey();
    //     return axios.post(`${webSetting.backendUrl}${webSetting.authingServer}/oauth/extras/token`, {
    //         client_id: "unity-client",
    //         client_secret: "unity",
    //         grant_type: "password",
    //         password: this.encryptData(password, publicKey),
    //         username: username
    //     });
    // }

    @service("query", { title: "字典项" })
    public dicionary(type: string) {
        return this._get<any>(`/free/dictionary/display/${type}`);
    }

    @service("query", { title: "获取加密需要的公钥" })
    public async getPublicKey(): Promise<any> {
        let or = await this._get<any>(`${webSetting.backendUrl}/oauth/extras/public-key`);
        Cookies.set("public-key", or.result || "none");
        return or.result;
    }

    public async getUserDetails(): Promise<AxiosResponse<any>> {
        return axios.get(`${webSetting.backendUrl}/unity/user/composite`);
    }

    public getTockenByCode(code: string) {
        return this._get(
            `${webSetting.backendUrl}/sso/token?applicationId=${webSetting.applicationId}&secret=${webSetting.secret}&grantType=authorization_code&code=${code}`
        );
    }

    public exchangeToken(casToken: string, casType: string = "egova"): Promise<AxiosResponse<any>> {
        return axios.post(`${webSetting.backendUrl}${webSetting.authingServer}/oauth/extras/token/exchange`, {
            cas_token: casToken,
            cas_type: casType
        });
    }

    @service("query", { title: "统一认证token获取client认证地址" })
    public getAuthorizeUrl(type: string = "egova") {
        return this._get<any>(`/sso/client/authorize-url?type=${type}`);
    }

    public logout(token: string) {
        if (!token) {
            token = Cookies.get("access_token") || "";
        }
        return axios.get(`${webSetting.backendUrl}${webSetting.authingServer}/oauth/extras/logout?token=${token}`);
    }

    /**
     *
     * @param cache 为true时，优先读取localStorage中的信息。
     */
    // @service("query", { title: "获取当前用户信息" })
    // public getCurrentUser(cache: boolean = true) {
    //     if (cache && localStorage.getItem("user")) {
    //         return {
    //             result: JSON.parse(localStorage.getItem("user") || ""),
    //             hasError: false
    //         };
    //     }
    //     return this._get<any>(`${this.authingServer}/unity/user/composite`);
    // }

    // 图片上传地址
    // public imgUploadUrl(): String {
    //     return this.url(`${this.authingServer}/free/image/upload?@state=single&kind=base`);
    // }

    // 获取多层字典项tree
    // @service("query", { title: "获取字典项树数据", showTip: false })
    // public getDictionaryItemTree(typeId: string) {
    //     return this._get<any>(`${this.authingServer}/unity/dictionary/item/${typeId}/tree`);
    // }

    @service("query", { title: "获取远程数据" })
    public getRemoteData(url: string) {
        return axios.get(url).then((res) => res.data);
    }

    // @service("query", { title: "获取字典分类以及组树", showTip: false })
    // public getDictionaryTree() {
    //     return this._get<any>(`${this.authingServer}/unity/dictionary/group-type-tree`);
    // }

    // @service("query", { title: "校验输入的密码是否正确" })
    // public async validatePassword(data: any): Promise<any> {
    //     let publicKey = await this.getPublicKey();
    //     data.password = this.encryptData(data.password, publicKey);
    //     return this._post<any>(`${this.authingServer}/unity/user/valid/password`, data);
    // }

    // @service("save", { title: "更新用户信息" })
    // public async updateUserInfo(user: any): Promise<any> {
    //     return this._put(`${this.authingServer}/unity/user/`, user);
    // }

    // @service("save", { title: "更新用户密码" })
    // public async updatePassword(data: any): Promise<any> {
    //     let publicKey = await this.getPublicKey();
    //     data.oldPassword = this.encryptData(data.oldPassword, publicKey);
    //     data.password = this.encryptData(data.password, publicKey);
    //     return this._post(`${this.authingServer}/unity/user/change/password`, data);
    // }

    // @service("query", { title: "查询枚举" })
    // public async getEnumByType(type: string) {
    //     return this._get<any>(`${this.server}/free/display/${type}`);
    // }

    // @service("save", { title: "保存分类", showErrorMsg: true })
    // public saveCategory(category: { name: string; type: string; id?: string; parentId?: string }) {
    //     if (category.id) {
    //         return this._put<any>(`${this.authingServer}/unity/category`, category);
    //     }
    //     return this._post<any>(`${this.authingServer}/unity/category`, category);
    // }
    // @service("save", { title: "编辑分类", showErrorMsg: true })
    // public editCategory(category: any) {
    //     return this._put<any>(`${this.authingServer}/unity/category`, category);
    // }
    // @service("save", { title: "删除分类", showErrorMsg: true })
    // public deleteCategory(id: string) {
    //     return this._delete<any>(`${this.authingServer}/unity/category/${id}?@state=ddcat`);
    // }
    // @service("query", { title: "获取分类树", showErrorMsg: true })
    // public getCategoryTree(type: string) {
    //     return this._get<any>(`${this.authingServer}/unity/category/tree?type=${type}`);
    // }

    public getEncryptPassword(password: string): string {
        let publicKey = sessionStorage.getItem("public-key");
        if (publicKey === "none" || !publicKey) {
            return password;
        }
        let encryptor = new JSEncrypt(); // 新建JSEncrypt对象
        encryptor.setPublicKey(publicKey); // 设置公钥
        return encryptor.encrypt(password);
    }
    @serviceHandler("query", { title: "查询所有部门" })
    getDepartmentTree() {
        return this._get<any>("/unity/department/tree");
    }
}
