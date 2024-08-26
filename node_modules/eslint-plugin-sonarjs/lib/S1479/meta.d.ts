export declare const meta: {
    type: string;
    docs: {
        description: string;
        recommended: boolean;
        url: string;
        requiresTypeChecking: boolean;
    };
};
export declare const sonarKey = "S1479";
export declare const schema: {
    readonly type: "array";
    readonly minItems: 0;
    readonly maxItems: 1;
    readonly items: [{
        readonly type: "integer";
        readonly minimum: 0;
    }];
};
