export declare const meta: {
    type: string;
    docs: {
        description: string;
        recommended: boolean;
        url: string;
        requiresTypeChecking: boolean;
    };
};
export declare const sonarKey = "S124";
export declare const schema: {
    readonly type: "array";
    readonly minItems: 0;
    readonly maxItems: 1;
    readonly items: [{
        readonly type: "object";
        readonly properties: {
            readonly regularExpression: {
                readonly type: "string";
            };
            readonly message: {
                readonly type: "string";
            };
            readonly flags: {
                readonly type: "string";
            };
        };
        readonly additionalProperties: false;
    }];
};
