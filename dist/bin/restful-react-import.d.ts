import { OperationObject } from "openapi3-ts";
import { UseGetProps } from "../useGet";
export interface Options {
    output: string;
    file?: string;
    url?: string;
    github?: string;
    transformer?: string;
    validation?: boolean;
    skipReact?: boolean;
}
export declare type AdvancedOptions = Options & {
    customImport?: string;
    customProps?: {
        [props in keyof Omit<UseGetProps<any, any, any, any>, "lazy" | "debounce" | "path">]: string | ((meta: {
            responseType: string;
        }) => string);
    };
    pathParametersEncodingMode?: "uriComponent" | "rfc3986";
    customGenerator?: (data: {
        componentName: string;
        verb: string;
        route: string;
        description: string;
        genericsTypes: string;
        operation: OperationObject;
        paramsInPath: string[];
        paramsTypes: string;
    }) => string;
};
export interface ExternalConfigFile {
    [backend: string]: AdvancedOptions;
}
//# sourceMappingURL=restful-react-import.d.ts.map