import { ComponentsObject, OpenAPIObject, OperationObject, ParameterObject, ReferenceObject, RequestBodyObject, ResponseObject, SchemaObject } from "openapi3-ts";
/**
 * Discriminator helper for `ReferenceObject`
 *
 * @param property
 */
export declare const isReference: (property: any) => property is ReferenceObject;
/**
 * Return the typescript equivalent of open-api data type
 *
 * @param item
 * @ref https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.1.md#data-types
 */
export declare const getScalar: (item: SchemaObject) => string;
/**
 * Return the output type from the $ref
 *
 * @param $ref
 */
export declare const getRef: ($ref: string) => string;
/**
 * Return the output type from an array
 *
 * @param item item with type === "array"
 */
export declare const getArray: (item: SchemaObject) => string;
/**
 * Return the output type from an object
 *
 * @param item item with type === "object"
 */
export declare const getObject: (item: SchemaObject) => string;
/**
 * Resolve the value of a schema object to a proper type definition.
 * @param schema
 */
export declare const resolveValue: (schema: SchemaObject) => string;
/**
 * Extract responses / request types from open-api specs
 *
 * @param responsesOrRequests reponses or requests object from open-api specs
 */
export declare const getResReqTypes: (responsesOrRequests: [string, ReferenceObject | ResponseObject | RequestBodyObject][]) => string;
/**
 * Return every params in a path
 *
 * @example
 * ```
 * getParamsInPath("/pet/{category}/{name}/");
 * // => ["category", "name"]
 * ```
 * @param path
 */
export declare const getParamsInPath: (path: string) => string[];
/**
 * Take a react props value style and convert it to object style
 *
 * Example:
 *  reactPropsValueToObjectValue(`{ getConfig("myVar") }`) // `getConfig("myVar")`
 */
export declare const reactPropsValueToObjectValue: (value: string) => string;
/**
 * Generate a restful-react component from openapi operation specs
 *
 * @param operation
 * @param verb
 * @param route
 * @param baseUrl
 * @param operationIds - List of `operationId` to check duplication
 */
export declare const generateRestfulComponent: (operation: OperationObject, verb: string, route: string, operationIds: string[], parameters?: (ReferenceObject | ParameterObject)[], schemasComponents?: ComponentsObject | undefined, customProps?: {
    pathParams?: string | ((meta: {
        responseType: string;
    }) => string) | undefined;
    requestOptions?: string | ((meta: {
        responseType: string;
    }) => string) | undefined;
    queryParams?: string | ((meta: {
        responseType: string;
    }) => string) | undefined;
    queryParamStringifyOptions?: string | ((meta: {
        responseType: string;
    }) => string) | undefined;
    localErrorOnly?: string | ((meta: {
        responseType: string;
    }) => string) | undefined;
    resolve?: string | ((meta: {
        responseType: string;
    }) => string) | undefined;
    mock?: string | ((meta: {
        responseType: string;
    }) => string) | undefined;
    base?: string | ((meta: {
        responseType: string;
    }) => string) | undefined;
} | undefined, skipReact?: boolean, pathParametersEncodingMode?: "uriComponent" | "rfc3986" | undefined, customGenerator?: ((data: {
    componentName: string;
    verb: string;
    route: string;
    description: string;
    genericsTypes: string;
    operation: OperationObject;
    paramsInPath: string[];
    paramsTypes: string;
}) => string) | undefined) => string;
/**
 * Generate the interface string
 *
 * @param name interface name
 * @param schema
 */
export declare const generateInterface: (name: string, schema: SchemaObject) => string;
/**
 * Propagate every `discriminator.propertyName` mapping to the original ref
 *
 * Note: This method directly mutate the `specs` object.
 *
 * @param specs
 */
export declare const resolveDiscriminator: (specs: OpenAPIObject) => void;
/**
 * Add the version of the spec
 *
 * @param version
 */
export declare const addVersionMetadata: (version: string) => string;
/**
 * Add common components and hooks (react-query)
 *
 * @param version
 */
export declare const addCommonComponentsAndHooks: () => string;
/**
 * Extract all types from #/components/schemas
 *
 * @param schemas
 */
export declare const generateSchemasDefinition: (schemas?: {
    [schema: string]: ReferenceObject | SchemaObject;
} | undefined) => string;
/**
 * Extract all types from #/components/requestBodies
 *
 * @param requestBodies
 */
export declare const generateRequestBodiesDefinition: (requestBodies?: {
    [request: string]: ReferenceObject | RequestBodyObject;
} | undefined) => string;
/**
 * Extract all types from #/components/responses
 *
 * @param responses
 */
export declare const generateResponsesDefinition: (responses?: {
    [response: string]: ReferenceObject | ResponseObject;
} | undefined) => string;
/**
 * Format a description to code documentation.
 *
 * @param description
 */
export declare const formatDescription: (description?: string | undefined, tabSize?: number) => string;
/**
 * Main entry of the generator. Generate restful-react component from openAPI.
 *
 * @param options.data raw data of the spec
 * @param options.format format of the spec
 * @param options.transformer custom function to transform your spec
 * @param options.validation validate the spec with ibm-openapi-validator tool
 * @param options.skipReact skip the generation of react components/hooks
 */
declare const importOpenApi: ({ data, format, transformer, validation, skipReact, customImport, customProps, customGenerator, pathParametersEncodingMode, }: {
    data: string;
    format: "yaml" | "json";
    transformer?: ((specs: OpenAPIObject) => OpenAPIObject) | undefined;
    validation?: boolean | undefined;
    skipReact?: boolean | undefined;
    customImport?: string | undefined;
    customProps?: {
        pathParams?: string | ((meta: {
            responseType: string;
        }) => string) | undefined;
        requestOptions?: string | ((meta: {
            responseType: string;
        }) => string) | undefined;
        queryParams?: string | ((meta: {
            responseType: string;
        }) => string) | undefined;
        queryParamStringifyOptions?: string | ((meta: {
            responseType: string;
        }) => string) | undefined;
        localErrorOnly?: string | ((meta: {
            responseType: string;
        }) => string) | undefined;
        resolve?: string | ((meta: {
            responseType: string;
        }) => string) | undefined;
        mock?: string | ((meta: {
            responseType: string;
        }) => string) | undefined;
        base?: string | ((meta: {
            responseType: string;
        }) => string) | undefined;
    } | undefined;
    customGenerator?: ((data: {
        componentName: string;
        verb: string;
        route: string;
        description: string;
        genericsTypes: string;
        operation: OperationObject;
        paramsInPath: string[];
        paramsTypes: string;
    }) => string) | undefined;
    pathParametersEncodingMode?: "uriComponent" | "rfc3986" | undefined;
}) => Promise<string>;
export default importOpenApi;
//# sourceMappingURL=import-open-api.d.ts.map