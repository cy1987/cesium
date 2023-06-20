import Cookies from "js-cookie";
import { LoginUtil } from "../utils";

export async function usegGtAuthorizeUrl(casType: string) {
    let url = Cookies.get(`${casType}-authorizeUrl`);
    if (url) {
        return url;
    }
    let res = await LoginUtil.getAuthorizeUrl(casType);
    if (!res.hasError) {
        Cookies.set(`${casType}-authorizeUrl`, res.result);
        console.log(`获取authorizeUrl成功:${res.result}`);
        return res.result;
    } else {
        //  Cookies.set(`${casType}-authorizeUrl`, "");
    }
    return res.result;
}

/**
 * 使用cas登录
 * @param casToken cas对应的token
 * @param casType  cas类型
 * @returns
 */
export async function useCasLogin(casToken: string, casType: string) {
    let token1 = Cookies.get(`${casType}:${casToken}`);
    let token2 = Cookies.get("access_token") || "";
    // 不相同说明切换了用户
    if (token1 !== token2) {
        LoginUtil.clearLoginFlag();
    }
    if (!LoginUtil.hasToken()) {
        let res = await LoginUtil.exchangeToken(casToken, casType);
        if (res && !res.hasError) {
            Cookies.set("access_token", res.result.access_token, {
                expires: res.result.expires_in
            });
            Cookies.set(`${casType}:${casToken}`, res.result.access_token, {
                expires: res.result.expires_in
            });
            console.log(`获取token成功:${Cookies.get("access_token")}`);
            return true;
        }
        return false;
    }
    return true;
}
