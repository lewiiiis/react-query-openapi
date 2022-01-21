import { IStringifyOptions } from "qs";
declare type ResolvePathOptions = {
    queryParamOptions?: IStringifyOptions;
    stripTrailingSlash?: boolean;
};
export declare function constructUrl<TQueryParams>(base: string, path: string, queryParams?: TQueryParams, resolvePathOptions?: ResolvePathOptions): string;
export {};
//# sourceMappingURL=constructUrl.d.ts.map