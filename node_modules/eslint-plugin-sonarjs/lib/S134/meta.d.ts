export declare const meta: {
    type: string;
    docs: {
        description: string;
        recommended: boolean;
        url: string;
        requiresTypeChecking: boolean;
    };
};
export declare const sonarKey = "S134";
export declare const schema: {
    readonly type: "array";
    readonly minItems: 0;
    readonly maxItems: 2;
    readonly items: [{
        readonly type: "object";
        readonly properties: {
            readonly maximumNestingLevel: {
                readonly type: "integer";
            };
        };
        readonly additionalProperties: false;
    }];
};
