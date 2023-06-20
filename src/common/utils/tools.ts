export const getObjectTypeToString = (obj: any) => Object.prototype.toString.call(obj).slice(8, -1);

/*
	指定长度和基数

*/
export const uuid = (len: number, radix: number) => {
    let chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz".split("");
    let uuid = [],
        i;
    radix = radix || chars.length;

    if (len) {
        // Compact form
        for (i = 0; i < len; i++) uuid[i] = chars[0 | Math.random() * radix];
    } else {
        // rfc4122, version 4 form
        let r;

        // rfc4122 requires these characters
        uuid[8] = uuid[13] = uuid[18] = uuid[23] = "-";
        uuid[14] = "4";

        // Fill in random data.  At i==19 set the high bits of clock sequence as
        // per rfc4122, sec. 4.1.5
        for (i = 0; i < 36; i++) {
            if (!uuid[i]) {
                r = 0 | Math.random() * 16;
                uuid[i] = chars[(i === 19) ? (r & 0x3) | 0x8 : r];
            }
        }
    }

    return uuid.join("");
};

export const getType = (obj: any) =>
    Object.prototype.toString.call(obj).slice(8, -1);
export const getQueryString = (name: string) => {
    let reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
    let r = window.location.search.substr(1).match(reg);
    if (r != null) {
        return unescape(r[2]);
    }
    return null;
};
export const removeQueryString = (name: string) => {
    // 从当前URL的?号开始的字符串
    // 如:http://www.baidu.com/s?wd=baidu&cl=3 它的search就是?wd=baidu&cl=3
    let queryString = window.location.search.substr(1);
    // 如果没有参数则返回空
    if (queryString !== undefined) {
        let reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
        return queryString.replace(reg, "");
    }
    return "";
};