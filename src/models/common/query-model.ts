import Paging from "./paging";
import { Sorting } from "./sorting";
export default interface QueryModel<T> {
    condition: T;
    paging: Paging;
    sorts?: Sorting;
    extras?: any;
}
