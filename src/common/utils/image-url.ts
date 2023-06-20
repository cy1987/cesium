import { webSetting } from "@/settings";

export function getUrl(fileId: string) {
    return webSetting.baseResourceHost + `/files/${fileId}`;
}
