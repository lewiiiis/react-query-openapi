export declare const composeUrl: (base?: string, parentPath?: string, path?: string) => string;
/**
 * If the path starts with slash, it is considered as absolute url.
 * If not, it is considered as relative url.
 * For example,
 * parentPath = "/someBasePath" and path = "/absolute" resolves to "/absolute"
 * whereas,
 * parentPath = "/someBasePath" and path = "relative" resolves to "/someBasePath/relative"
 */
export declare const composePath: (parentPath?: string, path?: string) => string;
//# sourceMappingURL=composeUrl.d.ts.map