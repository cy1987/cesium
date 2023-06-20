import { webSetting } from "@/settings";
import Cookies from "js-cookie";
import Axios from "axios";

export class UploadUtil {

    // 上传文件到网盘服务器
    public static async upload(formData: FormData) {
        let token = sessionStorage.getItem("access_token");
        let result = await Axios({
            url: webSetting.baseUrl + (webSetting.establishServer || "") + "/free/local-file/upload",
            method: "POST",
            data: formData,
            headers: {
                // Authorization: "Bearer " + token,
                "Content-Type": "multipart/form-data"

            }
        });
        return result.data;
    }
    // 对返回的文件id包装成能访问的文件
    public static wrapper(fileId: string) {
        return webSetting.baseUrl + `/free/local-file/${fileId}/download`;
    }
}
