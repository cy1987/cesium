import { global } from "@/settings";
import axios, { AxiosRequestConfig, CancelTokenSource } from "axios";
import Cookies from "js-cookie";
import { webSetting } from "@/settings";
// import { LoginUtil } from "@/common";

// Axios请求拦截器
axios.interceptors.request.use(
    (config: AxiosRequestConfig) => {
        // let token = LoginUtil.getToken();;
        let token = Cookies.get("access_token") || localStorage.getItem("access_token") || "";
        if (token && config.url && ~config.url.search(/unity|api/g)) {
            // 判断是否存在token，如果存在的话，则每个http header都加上token
            config.headers.Authorization = "Bearer " + token;
        }
        return config;
    },
    (error: any) => {
        console.error(error);
        return Promise.reject(error);
    }
);
/**
 * 业务服务基类。
 * @abstract
 * @class
 * @version 1.0.0
 */
export default abstract class ServiceBase {
    private static globalSource: CancelTokenSource = axios.CancelToken.source();
    public backendUrl = webSetting.backendUrl;
    public baseMapUrl = webSetting.baseMapUrl;
    public baseModelUrl = webSetting.baseModelUrl;
    public pageCode = webSetting.pageCode;
    public title = webSetting.title;
    public url(url: string): string {
        return webSetting.baseUrl.replace(/\/$/, "") + "/" + url.replace(/^\//, "");
    }

    /**
     * 把json对象转换成formData数据
     * @param data json对象
     */
    public toFormData(data: any): FormData {
        let fromData = new FormData();
        if (data) {
            Object.keys(data).forEach((key: any) => {
                // 忽略以“_”的参数
                if (key.indexOf("_") !== 0) {
                    fromData.append(key, data[key]);
                }
            });
        }
        return fromData;
    }

    public get config(): AxiosRequestConfig {
        return {
            baseURL: webSetting.backendUrl,
            timeout: 10000,
            cancelToken: ServiceBase.globalSource.token,
            validateStatus: (status: number) => {
                // token 失效
                if (status === 401) {
                    // Cookies.remove("access_token");
                    localStorage.removeItem("user");
                    // FIXME: 修复跳转到login界面
                    // window.location.href = "/login.html";
                    // let router = WorkStarter.context.router;
                    // router && router.push({ name: "login" });
                }
                return status >= 200 && status < 300;
            }
        };
    }

    /**
     * 取消请求
     * @param msg 描述信息
     * @param source CancelToken源(为空则取消所有请求)
     */
    public cancel(source: CancelTokenSource = ServiceBase.globalSource, msg?: string) {
        source.cancel(msg);
    }

    /**
     * 发送post请求
     * @param url 请求地址
     * @param data 发送的参数
     */
    public _post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
        return axios.post(url, data, { ...this.config, ...config }).then((res: any) => res.data);
    }

    /**
     * 发送get请求
     * @param url 请求地址
     */
    public _get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
        return axios.get(url, { ...this.config, ...config }).then((res: any) => res.data);
    }

    /**
     * 发送put请求
     * @param url 请求地址
     * @param data 请求参数
     */
    public _put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
        return axios.put(url, data, { ...this.config, ...config }).then((res: any) => res.data);
    }

    /**
     * 发送delete请求 请求地址
     * @param url
     */
    // protected _delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    //     return axios
    //         .delete(url, { ...this.config, ...config })
    //         .then(res => res.data);
    // }
    public _delete<T>(url: string, data?: any): Promise<T> {
        return axios.delete(this.url(url), { data: data }).then((res: any) => res.data);
    }
    /**
     * 导出数据
     * @param url
     * @param data
     */
    public _export(url: string, data?: any): Promise<any> {
        return axios
            .post(this.url(url), data, {
                headers: {
                    "X-Requested-With": "XMLHttpRequest",
                    "Content-Type": "application/json; charset=UTF-8",
                    "Access-Control-Allow-Origin": "*"
                },
                responseType: "arraybuffer"
            })
            .then((res: any) => {
                let blob = new Blob([res.data], {
                    type: "application/vnd.ms-excel"
                });
                let objectUrl = URL.createObjectURL(blob);
                window.location.href = objectUrl;
            });
    }
}
