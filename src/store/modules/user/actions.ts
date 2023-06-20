import { ActionTree } from "vuex";
import UserState from "./state";
import { CommonService } from "@/services";

// export async function getUserInfo({ commit, state }: any) {
//     if (state.id) return state;
//     let service: CommonService = new CommonService();
//     let res = await service.getCurrentUser();
//     commit("user/save", res.result);
//     console.count("user/save"); // TODO：调试后待删除
//     return res.result;
// }

// export default <ActionTree<UserState, any>>{ getUserInfo };
