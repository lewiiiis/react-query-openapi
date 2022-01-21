import { DebounceSettings } from "lodash";
import { IStringifyOptions } from "qs";
import { RestfulReactProviderProps } from "./Context";
import { GetState } from "./Get";
export declare type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
export interface UseGetProps<TData, TError, TQueryParams, TPathParams> {
    /**
     * The path at which to request data,
     * typically composed by parent Gets or the RestfulProvider.
     */
    path: string | ((pathParams: TPathParams) => string);
    /**
     * Path Parameters
     */
    pathParams?: TPathParams;
    /** Options passed into the fetch call. */
    requestOptions?: RestfulReactProviderProps["requestOptions"];
    /**
     * Query parameters
     */
    queryParams?: TQueryParams;
    /**
     * Query parameter stringify options
     */
    queryParamStringifyOptions?: IStringifyOptions;
    /**
     * Don't send the error to the Provider
     */
    localErrorOnly?: boolean;
    /**
     * A function to resolve data return from the backend, most typically
     * used when the backend response needs to be adapted in some way.
     */
    resolve?: (data: any) => TData;
    /**
     * Developer mode
     * Override the state with some mocks values and avoid to fetch
     */
    mock?: {
        data?: TData;
        error?: TError;
        loading?: boolean;
        response?: Response;
    };
    /**
     * Should we fetch data at a later stage?
     */
    lazy?: boolean;
    /**
     * An escape hatch and an alternative to `path` when you'd like
     * to fetch from an entirely different URL.
     *
     */
    base?: string;
    /**
     * How long do we wait between subsequent requests?
     * Uses [lodash's debounce](https://lodash.com/docs/4.17.10#debounce) under the hood.
     */
    debounce?: {
        wait?: number;
        options: DebounceSettings;
    } | boolean | number;
}
declare type RefetchOptions<TData, TError, TQueryParams, TPathParams> = Partial<Omit<UseGetProps<TData, TError, TQueryParams, TPathParams>, "lazy">>;
export interface UseGetReturn<TData, TError, TQueryParams = {}, TPathParams = unknown> extends GetState<TData, TError> {
    /**
     * Absolute path resolved from `base` and `path` (context & local)
     */
    absolutePath: string;
    /**
     * Cancel the current fetch
     */
    cancel: () => void;
    /**
     * Refetch
     */
    refetch: (options?: RefetchOptions<TData, TError, TQueryParams, TPathParams>) => Promise<TData | null>;
}
export declare function useGet<TData = any, TError = any, TQueryParams = {
    [key: string]: any;
}, TPathParams = unknown>(path: UseGetProps<TData, TError, TQueryParams, TPathParams>["path"], props?: Omit<UseGetProps<TData, TError, TQueryParams, TPathParams>, "path">): UseGetReturn<TData, TError, TQueryParams>;
export declare function useGet<TData = any, TError = any, TQueryParams = {
    [key: string]: any;
}, TPathParams = unknown>(props: UseGetProps<TData, TError, TQueryParams, TPathParams>): UseGetReturn<TData, TError, TQueryParams>;
export {};
//# sourceMappingURL=useGet.d.ts.map