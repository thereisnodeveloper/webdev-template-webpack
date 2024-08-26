export declare const meta: {
    type: string;
    docs: {
        description: string;
        recommended: boolean;
        url: string;
        requiresTypeChecking: boolean;
    };
};
export declare const sonarKey = "S1067";
export declare const schema: {
    readonly type: "array";
    readonly minItems: 0;
    readonly maxItems: 2;
    readonly items: [{
        readonly type: "object";
        readonly properties: {
            readonly max: {
                readonly type: "integer";
            };
        };
        readonly additionalProperties: false;
    }];
};
