import pako from "pako";

export default class Gzip{

    public static unzip(b64Data: any) {
        let strData = atob(b64Data);
        // Convert binary string to character-number array
        let charData = strData.split("").map(function (x) { return x.charCodeAt(0);});
        // Turn number array into byte-array
        let binData = new Uint8Array(charData);
        // unzip
        let data = pako.inflate(binData);

        // Convert gunzipped byteArray back to ascii string:
        // strData = String.fromCharCode.apply(null, new Uint16Array(data));
        strData = "";
        /**
         * String.fromCharCode.apply(null, array) 显示 Maximum call stack size exceeded
         * 超过最大调用堆栈大小
         * 
         */
        let chunk = 8 * 1024;
        let i;
        for (i = 0; i < data.length / chunk; i++) {
          strData += String.fromCharCode.apply(null, <any>data.slice(i * chunk, (i + 1) * chunk));
        }
        strData += String.fromCharCode.apply(null, <any>data.slice(i * chunk));
  
        // 将乱码的中文进行转换
        let jsonResult = decodeURIComponent(escape((strData)));
        return jsonResult;
    }
}