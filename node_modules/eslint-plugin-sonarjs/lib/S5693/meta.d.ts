export declare const meta: {
    type: string;
    docs: {
        description: string;
        recommended: boolean;
        url: string;
        requiresTypeChecking: boolean;
    };
};
export declare const sonarKey = "S5693";
export declare const schema: {
    readonly type: "array";
    readonly minItems: 0;
    readonly maxItems: 1;
    readonly items: [{
        readonly type: "object";
        readonly properties: {
            readonly fileUploadSizeLimit: {
                readonly type: "integer";
            };
            readonly standardSizeLimit: {
                readonly type: "integer";
            };
        };
        readonly additionalProperties: false;
    }];
};
