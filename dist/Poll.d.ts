import * as React from "react";
import { GetProps, GetState, Meta as GetComponentMeta } from "./Get";
import { IStringifyOptions } from "qs";
/**
 * Meta information returned from the poll.
 */
interface Meta extends GetComponentMeta {
    /**
     * The entire response object.
     */
    response: Response | null;
}
/**
 * States of the current poll
 */
interface States<TData, TError> {
    /**
     * Is the component currently polling?
     */
    polling: PollState<TData, TError>["polling"];
    /**
     * Is the initial request loading?
     */
    loading: PollState<TData, TError>["loading"];
    /**
     * Has the poll concluded?
     */
    finished: PollState<TData, TError>["finished"];
    /**
     * Is there an error? What is it?
     */
    error: PollState<TData, TError>["error"];
}
/**
 * Actions that can be executed within the
 * component.
 */
interface Actions {
    start: () => void;
    stop: () => void;
}
/**
 * Props that can control the Poll component.
 */
export interface PollProps<TData, TError, TQueryParams, TPathParams> {
    /**
     * What path are we polling on?
     */
    path: GetProps<TData, TError, TQueryParams, TPathParams>["path"];
    /**
     * A function that gets polled data, the current
     * states, meta information, and various actions
     * that can be executed at the poll-level.
     */
    children: (data: TData | null, states: States<TData, TError>, actions: Actions, meta: Meta) => React.ReactNode;
    /**
     * How long do we wait between repeating a request?
     * Value in milliseconds.
     *
     * Defaults to 1000.
     */
    interval?: number;
    /**
     * How long should a request stay open?
     * Value in seconds.
     *
     * Defaults to 60.
     */
    wait?: number;
    /**
     * A stop condition for the poll that expects
     * a boolean.
     *
     * @param data - The data returned from the poll.
     * @param response - The full response object. This could be useful in order to stop polling when !response.ok, for example.
     */
    until?: (data: TData | null, response: Response | null) => boolean;
    /**
     * Are we going to wait to start the poll?
     * Use this with { start, stop } actions.
     */
    lazy?: GetProps<TData, TError, TQueryParams, TPathParams>["lazy"];
    /**
     * Should the data be transformed in any way?
     */
    resolve?: (data: any, prevData: TData | null) => TData;
    /**
     * We can request foreign URLs with this prop.
     */
    base?: GetProps<TData, TError, TQueryParams, TPathParams>["base"];
    /**
     * Any options to be passed to this request.
     */
    requestOptions?: GetProps<TData, TError, TQueryParams, TPathParams>["requestOptions"];
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
}
/**
 * The state of the Poll component. This should contain
 * implementation details not necessarily exposed to
 * consumers.
 */
export interface PollState<TData, TError> {
    /**
     * Are we currently polling?
     */
    polling: boolean;
    /**
     * Have we finished polling?
     */
    finished: boolean;
    /**
     * What was the last response?
     */
    lastResponse: Response | null;
    /**
     * What data are we holding in here?
     */
    data: GetState<TData, TError>["data"];
    /**
     * What data did we had before?
     */
    previousData: GetState<TData, TError>["data"];
    /**
     * Are we loading?
     */
    loading: GetState<TData, TError>["loading"];
    /**
     * Do we currently have an error?
     */
    error: GetState<TData, TError>["error"];
    /**
     * Index of the last polled response.
     */
    lastPollIndex?: string;
}
declare function Poll<TData = any, TError = any, TQueryParams = {
    [key: string]: any;
}, TPathParams = unknown>(props: PollProps<TData, TError, TQueryParams, TPathParams>): JSX.Element;
export default Poll;
//# sourceMappingURL=Poll.d.ts.map