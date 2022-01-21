import { MutateMethod, MutateState } from "./Mutate";
import { Omit, UseGetProps } from "./useGet";
export interface UseMutateProps<TData, TError, TQueryParams, TRequestBody, TPathParams> extends Omit<UseGetProps<TData, TError, TQueryParams, TPathParams>, "lazy" | "debounce" | "mock"> {
    /**
     * What HTTP verb are we using?
     */
    verb: "POST" | "PUT" | "PATCH" | "DELETE";
    /**
     * Callback called after the mutation is done.
     *
     * @param body - Body given to mutate
     * @param data - Response data
     */
    onMutate?: (body: TRequestBody, data: TData) => void;
    /**
     * Developer mode
     * Override the state with some mocks values and avoid to fetch
     */
    mock?: {
        mutate?: MutateMethod<TData, TRequestBody, TQueryParams, TPathParams>;
        loading?: boolean;
    };
    /**
     * A function to encode body of DELETE requests when appending it
     * to an existing path
     */
    pathInlineBodyEncode?: typeof encodeURIComponent;
}
export interface UseMutateReturn<TData, TError, TRequestBody, TQueryParams, TPathParams> extends MutateState<TData, TError> {
    /**
     * Cancel the current fetch
     */
    cancel: () => void;
    /**
     * Call the mutate endpoint
     */
    mutate: MutateMethod<TData, TRequestBody, TQueryParams, TPathParams>;
}
export declare function useMutate<TData = any, TError = any, TQueryParams = {
    [key: string]: any;
}, TRequestBody = any, TPathParams = unknown>(props: UseMutateProps<TData, TError, TQueryParams, TRequestBody, TPathParams>): UseMutateReturn<TData, TError, TRequestBody, TQueryParams, TPathParams>;
export declare function useMutate<TData = any, TError = any, TQueryParams = {
    [key: string]: any;
}, TRequestBody = any, TPathParams = unknown>(verb: UseMutateProps<TData, TError, TQueryParams, TRequestBody, TPathParams>["verb"], path: UseMutateProps<TData, TError, TQueryParams, TRequestBody, TPathParams>["path"], props?: Omit<UseMutateProps<TData, TError, TQueryParams, TRequestBody, TPathParams>, "path" | "verb">): UseMutateReturn<TData, TError, TRequestBody, TQueryParams, TPathParams>;
//# sourceMappingURL=useMutate.d.ts.map