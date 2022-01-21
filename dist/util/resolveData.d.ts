import { GetDataError } from "../types";
export declare const resolveData: <TData, TError>({ data, resolve, }: {
    data: any;
    resolve?: ((data: any) => TData) | ((data: any) => Promise<TData>) | undefined;
}) => Promise<{
    data: TData | null;
    error: GetDataError<TError> | null;
}>;
//# sourceMappingURL=resolveData.d.ts.map