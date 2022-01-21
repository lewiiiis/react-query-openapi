import { DebounceSettings } from "lodash";
import * as React from "react";
import { RestfulReactProviderProps } from "./Context";
import { IStringifyOptions } from "qs";
/**
 * A function that resolves returned data from
 * a fetch call.
 */
export declare type ResolveFunction<TData> = (data: any) => TData;
export interface GetDataError<TError> {
    message: string;
    data: TError | string;
    status?: number;
}
/**
 * An enumeration of states that a fetchable
 * view could possibly have.
 */
export interface States<TData, TError> {
    /** Is our view currently loading? */
    loading: boolean;
    /** Do we have an error in the view? */
    error?: GetState<TData, TError>["error"];
}
export declare type GetMethod<TData> = () => Promise<TData | null>;
/**
 * An interface of actions that can be performed
 * within Get
 */
export interface Actions<TData> {
    /** Refetches the same path */
    refetch: GetMethod<TData>;
}
/**
 * Meta information returned to the fetchable
 * view.
 */
export interface Meta {
    /** The entire response object passed back from the request. */
    response: Response | null;
    /** The absolute path of this request. */
    absolutePath: string;
}
/**
 * Props for the <Get /> component.
 */
export interface GetProps<TData, TError, TQueryParams, TPathParams> {
    /**
     * The path at which to request data,
     * typically composed by parent Gets or the RestfulProvider.
     */
    path: string;
    /**
     * @private This is an internal implementation detail in restful-react, not meant to be used externally.
     * This helps restful-react correctly override `path`s when a new `base` property is provided.
     */
    __internal_hasExplicitBase?: boolean;
    /**
     * A function that recieves the returned, resolved
     * data.
     *
     * @param data - data returned from the request.
     * @param actions - a key/value map of HTTP verbs, aliasing destroy to DELETE.
     */
    children: (data: TData | null, states: States<TData, TError>, actions: Actions<TData>, meta: Meta) => React.ReactNode;
    /** Options passed into the fetch call. */
    requestOptions?: RestfulReactProviderProps["requestOptions"];
    /**
     * Path parameters
     */
    pathParams?: TPathParams;
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
    resolve?: ResolveFunction<TData>;
    /**
     * Should we wait until we have data before rendering?
     * This is useful in cases where data is available too quickly
     * to display a spinner or some type of loading state.
     */
    wait?: boolean;
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
     * The accumulated path from each level of parent GETs
     *  taking the absolute and relative nature of each path into consideration
     */
    parentPath?: string;
    /**
     * How long do we wait between subsequent requests?
     * Uses [lodash's debounce](https://lodash.com/docs/4.17.10#debounce) under the hood.
     */
    debounce?: {
        wait?: number;
        options: DebounceSettings;
    } | boolean | number;
}
/**
 * State for the <Get /> component. These
 * are implementation details and should be
 * hidden from any consumers.
 */
export interface GetState<TData, TError> {
    data: TData | null;
    response: Response | null;
    error: GetDataError<TError> | null;
    loading: boolean;
}
/**
 * The <Get /> component _with_ context.
 * Context is used to compose path props,
 * and to maintain the base property against
 * which all requests will be made.
 *
 * We compose Consumers immediately with providers
 * in order to provide new `parentPath` props that contain
 * a segment of the path, creating composable URLs.
 */
declare function Get<TData = any, TError = any, TQueryParams = {
    [key: string]: any;
}, TPathParams = unknown>(props: GetProps<TData, TError, TQueryParams, TPathParams>): JSX.Element;
export default Get;
//# sourceMappingURL=Get.d.ts.map