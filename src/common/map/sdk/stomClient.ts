import Stomp, { Client, Subscription, Frame, Message } from "stompjs";
import SockJS from "sockjs-client";
import math from "halo-math";

export class StompClient {
    /**
     * stompClient集合
     */
    private static _instances: { [index: string]: Promise<Client> } = {};
    private static _subscriptions: { [index: string]: Subscription } = {};

    public static getInstance(
        url: string
    ): Promise<Client> {
        // console.log("stop", StompClient._instances[url]);
        if (!StompClient._instances[url]) {
            // console.info(`New StompClient: ${url}`);
            const socket = new SockJS(url);
            const client = Stomp.over(socket);

            // 去掉websocket自带的调试信息
            client.debug = null;

            StompClient._instances[url] = new Promise<Client>(
                (resolve, reject) => {
                    client.connect(
                        "",
                        "",
                        (frame: Frame | undefined) => {
                            resolve(client);
                            // console.info(`StompClient 连接成功: ${url}`);
                        },
                        (error: any) => {
                            console.log(StompClient._instances[url]);
                            window.setTimeout(() => {
                                StompClient._instances[url] = undefined;
                                StompClient.getInstance(url);
                            }, 1000);
                            reject(error);
                            console.error(`StompClient 连接出错:${url}`, error);
                        }
                    );
                }
            );
        }
        return StompClient._instances[url];
    }

    public static async subscribe(
        destination: string,
        sockjsUrl: string,
        callback?: (result: any) => any
    ): Promise<Subscription | undefined> {
        try {
            const client: Client = await StompClient.getInstance(sockjsUrl);
            const id = `${sockjsUrl}-${destination}`;
            const subscription = client.subscribe(
                destination,
                (message: Message) => {
                    // math.throttle.lazy({
                    //     id: id,
                    //     target: message && message.body,
                    //     callback: () =>
                    //         callback &&
                    //         callback(
                    //             math.isString(message && message.body) &&
                    //             JSON.parse(message && message.body)
                    //         ),
                    //     interval: 400
                    // });
                    return callback(math.isString(message && message.body) && JSON.parse(message && message.body));
                }
                // { id: id }
            );  
            StompClient._subscriptions[id] = subscription;
            // console.info(`StompClient 订阅成功: ${destination}`);
            return subscription;
        } catch (error) {
            console.error(`StompClient 订阅失败: ${destination}`, error);
        }
    }

    public static unsubscribe(id?: string) {
        if (id) {
            if (!StompClient._subscriptions[id]) return;
            StompClient._subscriptions[id].unsubscribe();
            delete StompClient._subscriptions[id];
            // console.info(`StompClient 取消订阅成功: ${id}`);
        } else {
            Object.keys(StompClient._subscriptions).forEach(id =>
                StompClient.unsubscribe(id)
            );
        }
    }

    public static async disconnect(url?: string) {
        if (url) {
            if (!StompClient._instances[url]) return;
            (await StompClient._instances[url]).disconnect(() => {
                delete StompClient._instances[url];
                // console.info(`StompClient 关闭成功: ${url}`);
            });
        } else {
            Object.keys(StompClient._instances).forEach(url =>
                StompClient.disconnect(url)
            );
        }
    }
}