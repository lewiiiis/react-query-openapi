import * as React from "react";
import { RestfulReactProviderProps } from "./Context";
import { GetState, ResolveFunction } from "./Get";
import { IStringifyOptions } from "qs";
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
export interface MutateRequestOptions<TQueryParams, TPathParams> extends RequestInit {
    /**
     * Query parameters
     */
    queryParams?: TQueryParams;
    /**
     * Path parameters
     */
    pathParams?: TPathParams;
}
export declare type MutateMethod<TData, TRequestBody, TQueryParams, TPathParams> = (data: TRequestBody, mutateRequestOptions?: MutateRequestOptions<TQueryParams, TPathParams>) => Promise<TData>;
/**
 * Meta information returned to the fetchable
 * view.
 */
export interface Meta {
    /** The absolute path of this request. */
    absolutePath: string;
}
/**
 * Props for the <Mutate /> component.
 */
export interface MutateProps<TData, TError, TQueryParams, TRequestBody, TPathParams> {
    /**
     * The path at which to request data,
     * typically composed by parents or the RestfulProvider.
     */
    path?: string;
    /**
     * @private This is an internal implementation detail in restful-react, not meant to be used externally.
     * This helps restful-react correctly override `path`s when a new `base` property is provided.
     */
    __internal_hasExplicitBase?: boolean;
    /**
     * What HTTP verb are we using?
     */
    verb: "POST" | "PUT" | "PATCH" | "DELETE";
    /**
     * Query parameters
     */
    queryParams?: TQueryParams;
    /**
     * Query parameter stringify options
     */
    queryParamStringifyOptions?: IStringifyOptions;
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
    /** Options passed into the fetch call. */
    requestOptions?: RestfulReactProviderProps["requestOptions"];
    /**
     * Don't send the error to the Provider
     */
    localErrorOnly?: boolean;
    /**
     * A function that recieves a mutation function, along with
     * some metadata.
     *
     * @param actions - a key/value map of HTTP verbs, aliasing destroy to DELETE.
     */
    children: (mutate: MutateMethod<TData, TRequestBody, TQueryParams, TPathParams>, states: States<TData, TError>, meta: Meta) => React.ReactNode;
    /**
     * Callback called after the mutation is done.
     *
     * @param body - Body given to mutate
     * @param data - Response data
     */
    onMutate?: (body: TRequestBody, data: TData) => void;
    /**
     * A function to encode body of DELETE requests when appending it
     * to an existing path
     */
    pathInlineBodyEncode?: typeof encodeURIComponent;
    /**
     * A function to resolve data return from the backend, most typically
     * used when the backend response needs to be adapted in some way.
     */
    resolve?: ResolveFunction<TData>;
}
/**
 * State for the <Mutate /> component. These
 * are implementation details and should be
 * hidden from any consumers.
 */
export interface MutateState<TData, TError> {
    error: GetState<TData, TError>["error"];
    loading: boolean;
}
/**
 * The <Mutate /> component _with_ context.
 * Context is used to compose path props,
 * and to maintain the base property against
 * which all requests will be made.
 *
 * We compose Consumers immediately with providers
 * in order to provide new `parentPath` props that contain
 * a segment of the path, creating composable URLs.
 */
declare function Mutate<TData = any, TError = any, TQueryParams = {
    [key: string]: any;
}, TRequestBody = any, TPathParams = unknown>(props: MutateProps<TData, TError, TQueryParams, TRequestBody, TPathParams>): JSX.Element;
export default Mutate;
//# sourceMappingURL=Mutate.d.ts.map