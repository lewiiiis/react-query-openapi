/**
 * A function that resolves returned data from
 * a fetch call.
 */
export declare type ResolveFunction<T> = ((data: any) => T) | ((data: any) => Promise<T>);
export interface GetDataError<TError> {
    message: string;
    data: TError | string;
}
//# sourceMappingURL=types.d.ts.map