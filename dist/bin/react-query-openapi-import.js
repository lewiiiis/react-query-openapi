#!/usr/bin/env node
'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var tslib = require('tslib');
var chalk = _interopDefault(require('chalk'));
var program = _interopDefault(require('commander'));
var fs = require('fs');
var inquirer = _interopDefault(require('inquirer'));
var difference = _interopDefault(require('lodash/difference'));
var pick = _interopDefault(require('lodash/pick'));
var path = require('path');
var request = _interopDefault(require('request'));
var os = require('os');
var slash = _interopDefault(require('slash'));
var _case = require('case');
var openApiValidator = _interopDefault(require('ibm-openapi-validator'));
var get = _interopDefault(require('lodash/get'));
var groupBy = _interopDefault(require('lodash/groupBy'));
var isEmpty = _interopDefault(require('lodash/isEmpty'));
var set = _interopDefault(require('lodash/set'));
var uniq = _interopDefault(require('lodash/uniq'));
var swagger2openapi = _interopDefault(require('swagger2openapi'));
var YAML = _interopDefault(require('js-yaml'));

var IdentifierRegexp = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/;
/**
 * Discriminator helper for `ReferenceObject`
 *
 * @param property
 */
var isReference = function (property) {
    return Boolean(property.$ref);
};
/**
 * Return the typescript equivalent of open-api data type
 *
 * @param item
 * @ref https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.1.md#data-types
 */
var getScalar = function (item) {
    var nullable = item.nullable ? " | null" : "";
    switch (item.type) {
        case "int32":
        case "int64":
        case "number":
        case "integer":
        case "long":
        case "float":
        case "double":
            return (item.enum ? "" + item.enum.join(" | ") : "number") + nullable;
        case "boolean":
            return "boolean" + nullable;
        case "array":
            return getArray(item) + nullable;
        case "null":
            return "null";
        case "string":
        case "byte":
        case "binary":
        case "date":
        case "dateTime":
        case "date-time":
        case "password":
            return (item.enum ? "\"" + item.enum.join("\" | \"") + "\"" : "string") + nullable;
        case "object":
        default:
            return getObject(item) + nullable;
    }
};
/**
 * Return the output type from the $ref
 *
 * @param $ref
 */
var getRef = function ($ref) {
    if ($ref.startsWith("#/components/schemas")) {
        return _case.pascal($ref.replace("#/components/schemas/", ""));
    }
    else if ($ref.startsWith("#/components/responses")) {
        return _case.pascal($ref.replace("#/components/responses/", "")) + "Response";
    }
    else if ($ref.startsWith("#/components/parameters")) {
        return _case.pascal($ref.replace("#/components/parameters/", "")) + "Parameter";
    }
    else if ($ref.startsWith("#/components/requestBodies")) {
        return _case.pascal($ref.replace("#/components/requestBodies/", "")) + "RequestBody";
    }
    else {
        throw new Error("This library only resolve $ref that are include into `#/components/*` for now");
    }
};
/**
 * Return the output type from an array
 *
 * @param item item with type === "array"
 */
var getArray = function (item) {
    if (!item.items) {
        throw new Error("All arrays must have an `items` key defined");
    }
    var item_type = resolveValue(item.items);
    if (!isReference(item.items) && (item.items.oneOf || item.items.anyOf || item.items.allOf || item.items.enum)) {
        item_type = "(" + item_type + ")";
    }
    if (item.minItems && item.maxItems && item.minItems === item.maxItems) {
        return "[" + new Array(item.minItems).fill(item_type).join(", ") + "]";
    }
    return item_type + "[]";
};
var requireProperties = function (type, toRequire) {
    return "Require<" + type + ", " + toRequire.map(function (property) { return "\"" + property + "\""; }).join(" | ") + ">";
};
/**
 * Return the output type from an object
 *
 * @param item item with type === "object"
 */
var getObject = function (item) {
    if (isReference(item)) {
        return getRef(item.$ref);
    }
    if (item.allOf) {
        var composedType = item.allOf.map(resolveValue).join(" & ");
        if (item.required && item.required.length) {
            return requireProperties(composedType, item.required);
        }
        return composedType;
    }
    if (item.anyOf) {
        return item.anyOf.map(resolveValue).join(" | ");
    }
    if (item.oneOf) {
        var unionType = item.oneOf.map(resolveValue).join(" | ");
        if (item.required && item.required.length) {
            return requireProperties(unionType, item.required);
        }
        return unionType;
    }
    if (!item.type && !item.properties && !item.additionalProperties) {
        return "{}";
    }
    // Free form object (https://swagger.io/docs/specification/data-models/data-types/#free-form)
    if (item.type === "object" &&
        !item.properties &&
        (!item.additionalProperties || item.additionalProperties === true || isEmpty(item.additionalProperties))) {
        return "{[key: string]: any}";
    }
    // Consolidation of item.properties & item.additionalProperties
    var output = "{\n";
    if (item.properties) {
        output += Object.entries(item.properties)
            .map(function (_a) {
            var _b = tslib.__read(_a, 2), key = _b[0], prop = _b[1];
            var doc = isReference(prop) ? "" : formatDescription(prop.description, 2);
            var isRequired = (item.required || []).includes(key);
            var processedKey = IdentifierRegexp.test(key) ? key : "\"" + key + "\"";
            return "  " + doc + processedKey + (isRequired ? "" : "?") + ": " + resolveValue(prop) + ";";
        })
            .join("\n");
    }
    if (item.additionalProperties) {
        if (item.properties) {
            output += "\n";
        }
        output += "  [key: string]: " + (item.additionalProperties === true ? "any" : resolveValue(item.additionalProperties)) + ";";
    }
    if (item.properties || item.additionalProperties) {
        if (output === "{\n")
            return "{}";
        return output + "\n}";
    }
    return item.type === "object" ? "{[key: string]: any}" : "any";
};
/**
 * Resolve the value of a schema object to a proper type definition.
 * @param schema
 */
var resolveValue = function (schema) { return (isReference(schema) ? getRef(schema.$ref) : getScalar(schema)); };
/**
 * Extract responses / request types from open-api specs
 *
 * @param responsesOrRequests reponses or requests object from open-api specs
 */
var getResReqTypes = function (responsesOrRequests) {
    return uniq(responsesOrRequests.map(function (_a) {
        var e_1, _b;
        var _c = tslib.__read(_a, 2), _ = _c[0], res = _c[1];
        if (!res) {
            return "void";
        }
        if (isReference(res)) {
            return getRef(res.$ref);
        }
        if (res.content) {
            try {
                for (var _d = tslib.__values(Object.keys(res.content)), _e = _d.next(); !_e.done; _e = _d.next()) {
                    var contentType = _e.value;
                    if (contentType.startsWith("*/*") ||
                        contentType.startsWith("application/json") ||
                        contentType.startsWith("application/octet-stream")) {
                        var schema = res.content[contentType].schema;
                        return resolveValue(schema);
                    }
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_e && !_e.done && (_b = _d.return)) _b.call(_d);
                }
                finally { if (e_1) throw e_1.error; }
            }
            return "void";
        }
        return "void";
    })).join(" | ");
};
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
var getParamsInPath = function (path) {
    var n;
    var output = [];
    var templatePathRegex = /\{(\w+)}/g;
    // tslint:disable-next-line:no-conditional-assignment
    while ((n = templatePathRegex.exec(path)) !== null) {
        output.push(n[1]);
    }
    return output;
};
/**
 * Import and parse the openapi spec from a yaml/json
 *
 * @param data raw data of the spec
 * @param format format of the spec
 */
var importSpecs = function (data, extension) {
    var schema = extension === "yaml" ? YAML.safeLoad(data) : JSON.parse(data);
    return new Promise(function (resolve, reject) {
        if (!schema.openapi || !schema.openapi.startsWith("3.0")) {
            swagger2openapi.convertObj(schema, {}, function (err, convertedObj) {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(convertedObj.openapi);
                }
            });
        }
        else {
            resolve(schema);
        }
    });
};
/**
 * Generate a react-query component from openapi operation specs
 *
 * @param operation
 * @param verb
 * @param route
 * @param baseUrl
 * @param operationIds - List of `operationId` to check duplication
 */
var generateRestfulComponent = function (operation, verb, route, operationIds, parameters, schemasComponents, skipReact, pathParametersEncodingMode, customGenerator) {
    if (parameters === void 0) { parameters = []; }
    if (skipReact === void 0) { skipReact = false; }
    if (!operation.operationId) {
        throw new Error("Every path must have a operationId - No operationId set for " + verb + " " + route);
    }
    if (operationIds.includes(operation.operationId)) {
        throw new Error("\"" + operation.operationId + "\" is duplicated in your schema definition!");
    }
    operationIds.push(operation.operationId);
    route = route.replace(/\{/g, "${"); // `/pet/{id}` => `/pet/${id}`
    // Remove the last param of the route if we are in the DELETE case and generating React components/hooks
    var lastParamInTheRoute = null;
    if (!skipReact && verb === "delete") {
        var lastParamInTheRouteRegExp = /\/\$\{(\w+)\}\/?$/;
        lastParamInTheRoute = (route.match(lastParamInTheRouteRegExp) || [])[1];
        route = route.replace(lastParamInTheRouteRegExp, ""); // `/pet/${id}` => `/pet`
    }
    var componentName = _case.pascal(operation.operationId).replace("Controller", "");
    var isOk = function (_a) {
        var _b = tslib.__read(_a, 1), statusCode = _b[0];
        return statusCode.toString().startsWith("2");
    };
    var isError = function (_a) {
        var _b = tslib.__read(_a, 1), statusCode = _b[0];
        return statusCode.toString().startsWith("4") || statusCode.toString().startsWith("5") || statusCode === "default";
    };
    var responseTypes = getResReqTypes(Object.entries(operation.responses).filter(isOk)) || "void";
    var errorTypes = getResReqTypes(Object.entries(operation.responses).filter(isError)) || "unknown";
    var requestBodyTypes = getResReqTypes([["body", operation.requestBody]]);
    var needARequestBodyComponent = requestBodyTypes !== "void";
    var needAResponseComponent = responseTypes.includes("{");
    /**
     * We strip the ID from the URL in order to pass it as an argument to the
     * `delete` function for generated <DeleteResource /> components.
     *
     * For example:
     *
     *  A given request
     *    DELETE https://my.api/resource/123
     *
     *  Becomes
     *    <DeleteResource>
     *      {(deleteThisThing) => <Button onClick={() => deleteThisThing("123")}>DELETE IT</Button>}
     *    </DeleteResource>
     */
    var paramsInPath = getParamsInPath(route).filter(function (param) { return !(verb === "delete" && param === lastParamInTheRoute); });
    var _a = groupBy(tslib.__spread(parameters, (operation.parameters || [])).map(function (p) {
        if (isReference(p)) {
            return get(schemasComponents, p.$ref.replace("#/components/", "").replace("/", "."));
        }
        else {
            return p;
        }
    }), "in"), _b = _a.query, queryParams = _b === void 0 ? [] : _b, _c = _a.path, pathParams = _c === void 0 ? [] : _c;
    var paramsTypes = paramsInPath
        .map(function (p) {
        try {
            var _a = pathParams.find(function (i) { return i.name === p; }), name_1 = _a.name, required = _a.required, schema = _a.schema, description_1 = _a.description;
            return "" + (description_1 ? formatDescription(description_1, 2) : "") + name_1 + (required ? "" : "?") + ": " + resolveValue(schema);
        }
        catch (err) {
            return p + ": string";
            // throw new Error(`The path params ${p} can't be found in parameters (${operation.operationId})`);
        }
    })
        .join(";\n  ");
    var queryParamsType = queryParams
        .map(function (p) {
        var processedName = IdentifierRegexp.test(p.name) ? p.name : "\"" + p.name + "\"";
        return "" + formatDescription(p.description, 2) + processedName + (p.required ? "" : "?") + ": " + resolveValue(p.schema);
    })
        .join(";\n  ");
    // Retrieve the type of the param for delete verb
    var lastParamInTheRouteDefinition = operation.parameters && lastParamInTheRoute
        ? operation.parameters
            .map(function (p) {
            return isReference(p)
                ? get(schemasComponents, p.$ref.replace("#/components/", "").replace("/", "."))
                : p;
        })
            .find(function (p) { return p.name === lastParamInTheRoute; })
        : { schema: { type: "string" } };
    if (!lastParamInTheRouteDefinition) {
        throw new Error("The path params " + lastParamInTheRoute + " can't be found in parameters (" + operation.operationId + ")");
    }
    var lastParamInTheRouteType = !isReference(lastParamInTheRouteDefinition.schema) && lastParamInTheRouteDefinition.schema
        ? getScalar(lastParamInTheRouteDefinition.schema)
        : isReference(lastParamInTheRouteDefinition.schema)
            ? getRef(lastParamInTheRouteDefinition.schema.$ref)
            : "string";
    var responseType = needAResponseComponent ? componentName + "Response" : responseTypes;
    var genericsTypes = verb === "get"
        ? responseType + ", " + errorTypes + ", " + (queryParamsType ? componentName + "QueryParams" : "void") + ", " + (paramsInPath.length ? componentName + "PathParams" : "void")
        : responseType + ", " + errorTypes + ", " + (queryParamsType ? componentName + "QueryParams" : "void") + ", " + (verb === "delete" && lastParamInTheRoute
            ? lastParamInTheRouteType
            : needARequestBodyComponent
                ? componentName + "RequestBody"
                : requestBodyTypes) + ", " + (paramsInPath.length ? componentName + "PathParams" : "void");
    // const genericsTypesForHooksProps =
    //   verb === "get"
    //     ? `${responseType}, ${errorTypes}, ${queryParamsType ? componentName + "QueryParams" : "void"}, ${
    //         paramsInPath.length ? componentName + "PathParams" : "void"
    //       }`
    //     : `${responseType}, ${errorTypes}, ${queryParamsType ? componentName + "QueryParams" : "void"}, ${
    //         verb === "delete" && lastParamInTheRoute
    //           ? lastParamInTheRouteType
    //           : needARequestBodyComponent
    //           ? componentName + "RequestBody"
    //           : requestBodyTypes
    //       }, ${paramsInPath.length ? componentName + "PathParams" : "void"}`;
    // const customPropsEntries = Object.entries(customProps).map(([key, prop]) => {
    //   if (typeof prop === "function") {
    //     return [key, prop({ responseType })];
    //   }
    //   return [key, prop];
    // });
    var description = formatDescription(operation.summary && operation.description
        ? operation.summary + "\n\n" + operation.description
        : "" + (operation.summary || "") + (operation.description || ""));
    var output = "" + (needAResponseComponent
        ? "\nexport " + (responseTypes.includes("|") || responseTypes.includes("&")
            ? "type " + componentName + "Response ="
            : "interface " + componentName + "Response") + " " + responseTypes + "\n"
        : "") + (queryParamsType
        ? "\nexport interface " + componentName + "QueryParams {\n  " + queryParamsType + ";\n}\n"
        : "") + (paramsInPath.length
        ? "\nexport interface " + componentName + "PathParams {\n  " + paramsTypes + "\n}\n"
        : "") + (needARequestBodyComponent
        ? "\nexport " + ("type " + componentName + "RequestBody = " + requestBodyTypes)
        : "") + "\n";
    if (!skipReact) {
        var encode = pathParametersEncodingMode ? "encode" : "";
        output += description + "\n";
        var path = paramsInPath.length ? encode + "`" + route.replace(/\$\{/g, "${") + "`" : encode + "`" + route + "`";
        // Custom Hooks
        if (verb === "get") {
            output += "export interface Use" + componentName + "Props {\n    " + (paramsTypes ? paramsTypes + ";\n\t" : "") + " " + (queryParamsType ? "params: " + componentName + "QueryParams;\n\t" : "") + " " + (needARequestBodyComponent ? "body: " + componentName + "RequestBody;\n\t" : "") + (verb === "get" ? "queryOptions?: QueryObserverOptions<any>" : "mutationOptions?: MutationOptions") + ";\n    } \n\n";
            output += "export const use" + componentName + " = (" + (paramsInPath.length || queryParamsType
                ? "{" + (queryParamsType ? "params," : "") + " " + (paramsInPath.length === 1 ? paramsInPath + "," : paramsInPath.join(", ")) + " queryOptions}"
                : "{queryOptions}") + ": Use" + componentName + "Props) => useQuery<" + responseType + ">(" + path + (queryParamsType ? " + " + "`?${Object.keys(params).map(key => `${key}=${params[key]}`).join('&')}`" : "") + ", () => axios." + verb + "(" + path + " " + (queryParamsType ? ",{params}" : "") + ").then(data => data.data), { refetchOnMount: false, ...queryOptions });\n\n";
            output += "export const useInvalidate" + componentName + " = (" + paramsTypes + ") => useInvalidateQuery(" + path + ", \"invalidate" + componentName + "\");\n\n";
            // output += `export const ${Component}${componentName} = (props: QueryProps<${responseType}>) => <Query<${responseType}> path={${path}} {...props}/>\n\n`;
        }
        else {
            output += "export interface Use" + componentName + "Variables {\n        " + (paramsTypes ? paramsTypes + ";\n\t" : "") + " " + (queryParamsType ? "params: " + componentName + "QueryParams;\n\t" : "") + " " + (needARequestBodyComponent ? "body: " + componentName + "RequestBody;\n\t" : "") + "\n        } \n\n";
            output += "export const use" + componentName + " = (mutationOptions: MutationOptions) => useMutation<" + responseType + ", any, Use" + componentName + "Variables>(" + path.replace(/[{}$]/g, "") + ", ({" + (paramsInPath.length === 1 ? "" + paramsInPath : paramsInPath.join(", ")) + " " + (needARequestBodyComponent ? (paramsInPath.length ? "," : "") + " body" : "") + " }) => axios." + verb + "(" + path + " " + (needARequestBodyComponent ? ",body" : verb !== "delete" ? ",{}" : "") + " " + (queryParamsType ? ",{params}" : ",{}") + "), mutationOptions);\n\n";
        }
    }
    // Custom version
    if (customGenerator) {
        output += customGenerator({
            componentName: componentName,
            verb: verb,
            route: route,
            description: description,
            genericsTypes: genericsTypes,
            paramsInPath: paramsInPath,
            paramsTypes: paramsTypes,
            operation: operation,
        });
    }
    return output;
};
/**
 * Generate the interface string
 *
 * @param name interface name
 * @param schema
 */
var generateInterface = function (name, schema) {
    var scalar = getScalar(schema);
    var isEmptyInterface = scalar === "{}";
    return "" + formatDescription(schema.description) + (isEmptyInterface ? "// tslint:disable-next-line:no-empty-interface\n" : "") + "export interface " + _case.pascal(name) + " " + scalar;
};
/**
 * Propagate every `discriminator.propertyName` mapping to the original ref
 *
 * Note: This method directly mutate the `specs` object.
 *
 * @param specs
 */
var resolveDiscriminator = function (specs) {
    if (specs.components && specs.components.schemas) {
        Object.values(specs.components.schemas).forEach(function (schema) {
            if (isReference(schema) || !schema.discriminator || !schema.discriminator.mapping) {
                return;
            }
            var _a = schema.discriminator, mapping = _a.mapping, propertyName = _a.propertyName;
            Object.entries(mapping).forEach(function (_a) {
                var _b = tslib.__read(_a, 2), name = _b[0], ref = _b[1];
                if (!ref.startsWith("#/components/schemas/")) {
                    throw new Error("Discriminator mapping outside of `#/components/schemas` is not supported");
                }
                set(specs, "components.schemas." + ref.slice("#/components/schemas/".length) + ".properties." + propertyName + ".enum", [
                    name,
                ]);
            });
        });
    }
};
/**
 * Add the version of the spec
 *
 * @param version
 */
var addVersionMetadata = function (version) { return "export const SPEC_VERSION = \"" + version + "\"; \n"; };
/**
 * Add common components and hooks (react-query)
 *
 * @param version
 */
var addCommonComponentsAndHooks = function () { return "\n\ninterface QueryProps<T> {\n  children?: (queryResult: QueryObserverResult<T>) => React.ReactNode;\n}\n\nconst Query = <T,>({ children, path }: { path: string } & QueryProps<T>) => {\n  const result = useQuery<T>(path, () => fetch(path).then((res) => res.json()));\n  return children?.(result) as JSX.Element;\n};\n\nconst useInvalidateQuery = <T extends string>(\n  queryKey: string,\n  as: T\n): Record<T, () => void> => {\n  const queryClient = useQueryClient();\n  return { [as]: () => queryClient.invalidateQueries(queryKey) } as any;\n};\n\n"; };
/**
 * Extract all types from #/components/schemas
 *
 * @param schemas
 */
var generateSchemasDefinition = function (schemas) {
    if (schemas === void 0) { schemas = {}; }
    if (isEmpty(schemas)) {
        return "";
    }
    return (Object.entries(schemas)
        .map(function (_a) {
        var _b = tslib.__read(_a, 2), name = _b[0], schema = _b[1];
        return !isReference(schema) &&
            (!schema.type || schema.type === "object") &&
            !schema.allOf &&
            !schema.anyOf &&
            !schema.oneOf &&
            !isReference(schema) &&
            !schema.nullable
            ? generateInterface(name, schema)
            : formatDescription(isReference(schema) ? undefined : schema.description) + "export type " + _case.pascal(name) + " = " + resolveValue(schema) + ";";
    })
        .join("\n\n") + "\n");
};
/**
 * Extract all types from #/components/requestBodies
 *
 * @param requestBodies
 */
var generateRequestBodiesDefinition = function (requestBodies) {
    if (requestBodies === void 0) { requestBodies = {}; }
    if (isEmpty(requestBodies)) {
        return "";
    }
    return ("\n" +
        Object.entries(requestBodies)
            .map(function (_a) {
            var _b = tslib.__read(_a, 2), name = _b[0], requestBody = _b[1];
            var doc = isReference(requestBody) ? "" : formatDescription(requestBody.description);
            var type = getResReqTypes([["", requestBody]]);
            var isEmptyInterface = type === "{}";
            if (isEmptyInterface) {
                return "// tslint:disable-next-line:no-empty-interface\nexport interface " + _case.pascal(name) + "RequestBody " + type;
            }
            else if (type.includes("{") && !type.includes("|") && !type.includes("&")) {
                return doc + "export interface " + _case.pascal(name) + "RequestBody " + type;
            }
            else {
                return doc + "export type " + _case.pascal(name) + "RequestBody = " + type + ";";
            }
        })
            .join("\n\n") +
        "\n");
};
/**
 * Extract all types from #/components/responses
 *
 * @param responses
 */
var generateResponsesDefinition = function (responses) {
    if (responses === void 0) { responses = {}; }
    if (isEmpty(responses)) {
        return "";
    }
    return ("\n" +
        Object.entries(responses)
            .map(function (_a) {
            var _b = tslib.__read(_a, 2), name = _b[0], response = _b[1];
            var doc = isReference(response) ? "" : formatDescription(response.description);
            var type = getResReqTypes([["", response]]);
            var isEmptyInterface = type === "{}";
            if (isEmptyInterface) {
                return "// tslint:disable-next-line:no-empty-interface\nexport interface " + _case.pascal(name) + "Response " + type;
            }
            else if (type.includes("{") && !type.includes("|") && !type.includes("&")) {
                return doc + "export interface " + _case.pascal(name) + "Response " + type;
            }
            else {
                return doc + "export type " + _case.pascal(name) + "Response = " + type + ";";
            }
        })
            .join("\n\n") +
        "\n");
};
/**
 * Format a description to code documentation.
 *
 * @param description
 */
var formatDescription = function (description, tabSize) {
    if (tabSize === void 0) { tabSize = 0; }
    return description
        ? "/**\n" + description
            .split("\n")
            .map(function (i) { return " ".repeat(tabSize) + " * " + i; })
            .join("\n") + "\n" + " ".repeat(tabSize) + " */\n" + " ".repeat(tabSize)
        : "";
};
/**
 * Validate the spec with ibm-openapi-validator (with a custom pretty logger).
 *
 * @param specs openAPI spec
 */
var validate = function (specs) { return tslib.__awaiter(void 0, void 0, void 0, function () {
    var log, wasConsoleLogCalledFromBlackBox, _a, errors, warnings;
    return tslib.__generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                log = console.log;
                wasConsoleLogCalledFromBlackBox = false;
                console.log = function () {
                    var props = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        props[_i] = arguments[_i];
                    }
                    wasConsoleLogCalledFromBlackBox = true;
                    log.apply(void 0, tslib.__spread(props));
                };
                return [4 /*yield*/, openApiValidator(specs)];
            case 1:
                _a = _b.sent(), errors = _a.errors, warnings = _a.warnings;
                console.log = log; // reset console.log because we're done with the black box
                if (wasConsoleLogCalledFromBlackBox) {
                    log("More information: https://github.com/IBM/openapi-validator/#configuration");
                }
                if (warnings.length) {
                    log(chalk.yellow("(!) Warnings"));
                    warnings.forEach(function (i) {
                        return log(chalk.yellow("\nMessage : " + i.message + "\nPath    : " + i.path));
                    });
                }
                if (errors.length) {
                    log(chalk.red("(!) Errors"));
                    errors.forEach(function (i) {
                        return log(chalk.red("\nMessage : " + i.message + "\nPath    : " + i.path));
                    });
                }
                return [2 /*return*/];
        }
    });
}); };
/**
 * Get the url encoding function to be aliased at the module scope.
 * This function is used to encode the path parameters.
 *
 * @param mode Either "uricomponent" or "rfc3986". "rfc3986" mode also encodes
 *             symbols from the `!'()*` range, while "uricomponent" leaves those as is.
 */
var getEncodingFunction = function (mode) {
    if (mode === "uriComponent")
        return "encodeURIComponent";
    return "(uriComponent: string | number | boolean) => {\n  return encodeURIComponent(uriComponent).replace(\n      /[!'()*]/g,\n      (c: string) => `%${c.charCodeAt(0).toString(16)}`,\n  );\n};";
};
/**
 * Main entry of the generator. Generate react-query component from openAPI.
 *
 * @param options.data raw data of the spec
 * @param options.format format of the spec
 * @param options.transformer custom function to transform your spec
 * @param options.validation validate the spec with ibm-openapi-validator tool
 * @param options.skipReact skip the generation of react components/hooks
 */
var importOpenApi = function (_a) {
    var data = _a.data, format = _a.format, transformer = _a.transformer, validation = _a.validation, skipReact = _a.skipReact, customImport = _a.customImport, pathParametersEncodingMode = _a.pathParametersEncodingMode;
    return tslib.__awaiter(void 0, void 0, void 0, function () {
        var operationIds, specs, output, haveGet, haveMutate, havePoll, imports, outputHeaders;
        return tslib.__generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    operationIds = [];
                    return [4 /*yield*/, importSpecs(data, format)];
                case 1:
                    specs = _b.sent();
                    if (transformer) {
                        specs = transformer(specs);
                    }
                    if (!validation) return [3 /*break*/, 3];
                    return [4 /*yield*/, validate(specs)];
                case 2:
                    _b.sent();
                    _b.label = 3;
                case 3:
                    resolveDiscriminator(specs);
                    output = "";
                    console.log(addVersionMetadata(specs.info.version));
                    // output += addVersionMetadata(specs.info.version);
                    output += addCommonComponentsAndHooks();
                    output += generateSchemasDefinition(specs.components && specs.components.schemas);
                    output += generateRequestBodiesDefinition(specs.components && specs.components.requestBodies);
                    output += generateResponsesDefinition(specs.components && specs.components.responses);
                    Object.entries(specs.paths).forEach(function (_a) {
                        var _b = tslib.__read(_a, 2), route = _b[0], verbs = _b[1];
                        Object.entries(verbs).forEach(function (_a) {
                            var _b = tslib.__read(_a, 2), verb = _b[0], operation = _b[1];
                            if (["get", "post", "patch", "put", "delete"].includes(verb)) {
                                output += generateRestfulComponent(operation, verb, route, operationIds, verbs.parameters, specs.components);
                            }
                        });
                    });
                    haveGet = Boolean(output.match(/<Get</));
                    haveMutate = Boolean(output.match(/<Mutate</));
                    havePoll = Boolean(output.match(/<Poll</));
                    imports = [];
                    if (haveGet) {
                        imports.push("Get", "GetProps", "useGet", "UseGetProps");
                    }
                    if (haveMutate) {
                        imports.push("Mutate", "MutateProps", "useMutate", "UseMutateProps");
                    }
                    if (havePoll) {
                        imports.push("Poll", "PollProps");
                    }
                    outputHeaders = "/* Generated by react-query-openapi */\n\n";
                    if (!skipReact) {
                        outputHeaders += "import React from \"react\";\nimport { QueryObserverResult, useQuery, useMutation, useQueryClient, QueryObserverOptions, MutationOptions } from \"react-query\";\nimport axios from \"axios\";\n";
                    }
                    if (customImport) {
                        outputHeaders += "\n" + customImport + "\n";
                    }
                    if (output.match(/Require</)) {
                        outputHeaders += "\ntype Require<T,R extends keyof T> = T & Required<Pick<T, R>>;\n";
                    }
                    if (pathParametersEncodingMode) {
                        outputHeaders += getEncodingFunction(pathParametersEncodingMode) + "\n\n    const encodingTagFactory = (encodingFn: typeof encodeURIComponent) => (\n      strings: TemplateStringsArray,\n      ...params: (string | number | boolean)[]\n    ) =>\n      strings.reduce(\n          (accumulatedPath, pathPart, idx) =>\n              `${accumulatedPath}${pathPart}${\n                  idx < params.length ? encodingFn(params[idx]) : ''\n              }`,\n          '',\n      );\n\n    const encode = encodingTagFactory(encodingFn);\n\n    ";
                    }
                    return [2 /*return*/, outputHeaders + output];
            }
        });
    });
};

var log = console.log; // tslint:disable-line:no-console
program.option("-o, --output [value]", "output file destination");
program.option("-f, --file [value]", "input file (yaml or json openapi specs)");
program.option("-u, --url [value]", "url to spec (yaml or json openapi specs)");
program.option("-g, --github [value]", "github path (format: `owner:repo:branch:path`)");
program.option("-t, --transformer [value]", "transformer function path");
program.option("--validation", "add the validation step (provided by ibm-openapi-validator)");
program.option("--skip-react", "skip the generation of react components/hooks");
program.option("--config [value]", "override flags by a config file");
program.parse(process.argv);
var createSuccessMessage = function (backend) {
    return chalk.green((backend ? "[" + backend + "] " : "") + "\uD83C\uDF89  Your OpenAPI spec has been converted into ready to use react-query hooks and components!");
};
var successWithoutOutputMessage = chalk.yellow("Success! No output path specified; printed to standard output.");
var importSpecs$1 = function (options) { return tslib.__awaiter(void 0, void 0, void 0, function () {
    var transformer, optionsKeys, importOptions, data, ext, format, url_1, urlSpecReq_1, github_1, accessToken, githubTokenPath_1, answers, _a, owner, repo, branch, path$1, githubSpecReq_1;
    return tslib.__generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                transformer = options.transformer ? require(path.join(process.cwd(), options.transformer)) : undefined;
                optionsKeys = [
                    "validation",
                    "customImport",
                    "customGenerator",
                    "pathParametersEncodingMode",
                    "skipReact",
                ];
                importOptions = pick(options, optionsKeys);
                if (!options.file && !options.url && !options.github) {
                    throw new Error("You need to provide an input specification with `--file`, '--url', or `--github`");
                }
                if (!options.file) return [3 /*break*/, 1];
                data = fs.readFileSync(path.join(process.cwd(), options.file), "utf-8");
                ext = path.parse(options.file).ext;
                format = [".yaml", ".yml"].includes(ext.toLowerCase()) ? "yaml" : "json";
                return [2 /*return*/, importOpenApi(tslib.__assign({ data: data,
                        format: format,
                        transformer: transformer }, importOptions))];
            case 1:
                if (!options.url) return [3 /*break*/, 2];
                url_1 = options.url;
                urlSpecReq_1 = {
                    method: "GET",
                    url: url_1,
                    headers: {
                        "user-agent": "react-query-openapi-importer",
                    },
                };
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        request(urlSpecReq_1, function (error, response, body) { return tslib.__awaiter(void 0, void 0, void 0, function () {
                            var format;
                            return tslib.__generator(this, function (_a) {
                                if (error) {
                                    return [2 /*return*/, reject(error)];
                                }
                                format = "yaml";
                                if (url_1.endsWith(".json") || response.headers["content-type"] === "application/json") {
                                    format = "json";
                                }
                                resolve(importOpenApi(tslib.__assign({ data: body, format: format,
                                    transformer: transformer }, importOptions)));
                                return [2 /*return*/];
                            });
                        }); });
                    })];
            case 2:
                if (!options.github) return [3 /*break*/, 6];
                github_1 = options.github;
                accessToken = process.env.GITHUB_TOKEN;
                githubTokenPath_1 = path.join(os.homedir(), ".react-query-openapi");
                if (!(!accessToken && fs.existsSync(githubTokenPath_1))) return [3 /*break*/, 3];
                accessToken = fs.readFileSync(githubTokenPath_1, "utf-8");
                return [3 /*break*/, 5];
            case 3:
                if (!!accessToken) return [3 /*break*/, 5];
                return [4 /*yield*/, inquirer.prompt([
                        {
                            type: "input",
                            name: "githubToken",
                            message: "Please provide a GitHub token with `repo` rules checked ( https://help.github.com/en/github/authenticating-to-github/creating-a-personal-access-token-for-the-command-line )",
                        },
                        {
                            type: "confirm",
                            name: "saveToken",
                            message: "Would you like to store your token for the next time? (stored in your " + slash(githubTokenPath_1) + ")",
                        },
                    ])];
            case 4:
                answers = _b.sent();
                if (answers.saveToken) {
                    fs.writeFileSync(githubTokenPath_1, answers.githubToken);
                }
                accessToken = answers.githubToken;
                _b.label = 5;
            case 5:
                _a = tslib.__read(github_1.split(":"), 4), owner = _a[0], repo = _a[1], branch = _a[2], path$1 = _a[3];
                githubSpecReq_1 = {
                    method: "POST",
                    url: "https://api.github.com/graphql",
                    headers: {
                        "content-type": "application/json",
                        "user-agent": "react-query-importer",
                        authorization: "bearer " + accessToken,
                    },
                    body: JSON.stringify({
                        query: "query {\n          repository(name: \"" + repo + "\", owner: \"" + owner + "\") {\n            object(expression: \"" + branch + ":" + path$1 + "\") {\n              ... on Blob {\n                text\n              }\n            }\n          }\n        }",
                    }),
                };
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        request(githubSpecReq_1, function (error, _, rawBody) { return tslib.__awaiter(void 0, void 0, void 0, function () {
                            var body, answers, format;
                            return tslib.__generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        if (error) {
                                            return [2 /*return*/, reject(error)];
                                        }
                                        body = JSON.parse(rawBody);
                                        if (!!body.data) return [3 /*break*/, 3];
                                        if (!(body.message === "Bad credentials")) return [3 /*break*/, 2];
                                        return [4 /*yield*/, inquirer.prompt([
                                                {
                                                    type: "confirm",
                                                    name: "removeToken",
                                                    message: "Your token doesn't have the correct permissions, should we remove it?",
                                                },
                                            ])];
                                    case 1:
                                        answers = _a.sent();
                                        if (answers.removeToken) {
                                            fs.unlinkSync(githubTokenPath_1);
                                        }
                                        _a.label = 2;
                                    case 2: return [2 /*return*/, reject(body.message)];
                                    case 3:
                                        format = github_1.toLowerCase().includes(".yaml") || github_1.toLowerCase().includes(".yml") ? "yaml" : "json";
                                        resolve(importOpenApi(tslib.__assign({ data: body.data.repository.object.text, format: format,
                                            transformer: transformer }, importOptions)));
                                        return [2 /*return*/];
                                }
                            });
                        }); });
                    })];
            case 6: return [2 /*return*/, Promise.reject("Please provide a file (--file), a url (--url), or a github (--github) input")];
        }
    });
}); };
if (program.config) {
    // Use config file as configuration (advanced usage)
    // tslint:disable-next-line: no-var-requires
    var config = require(path.join(process.cwd(), program.config));
    var mismatchArgs = difference(program.args, Object.keys(config));
    if (mismatchArgs.length) {
        log(chalk.yellow(mismatchArgs.join(", ") + " " + (mismatchArgs.length === 1 ? "is" : "are") + " not defined in your configuration!"));
    }
    Object.entries(config)
        .filter(function (_a) {
        var _b = tslib.__read(_a, 1), backend = _b[0];
        return (program.args.length === 0 ? true : program.args.includes(backend));
    })
        .forEach(function (_a) {
        var _b = tslib.__read(_a, 2), backend = _b[0], options = _b[1];
        importSpecs$1(options)
            .then(function (data) {
            if (options.output) {
                fs.writeFileSync(path.join(process.cwd(), options.output), data);
                log(createSuccessMessage(backend));
            }
            else {
                log(data);
                log(successWithoutOutputMessage);
            }
        })
            .catch(function (err) {
            log(chalk.red(err));
            process.exit(1);
        });
    });
}
else {
    // Use flags as configuration
    importSpecs$1(program)
        .then(function (data) {
        if (program.output) {
            fs.writeFileSync(path.join(process.cwd(), program.output), data);
            log(createSuccessMessage());
        }
        else {
            log(data);
            log(successWithoutOutputMessage);
        }
    })
        .catch(function (err) {
        log(chalk.red(err));
        process.exit(1);
    });
}
