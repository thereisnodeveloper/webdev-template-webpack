"use strict";
/*
 * SonarQube JavaScript Plugin
 * Copyright (C) 2011-2024 SonarSource SA
 * mailto:info AT sonarsource DOT com
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 3 of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program; if not, write to the Free Software Foundation,
 * Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 */
// https://sonarsource.github.io/rspec/#/rspec/S6265/javascript
Object.defineProperty(exports, "__esModule", { value: true });
exports.rule = void 0;
const helpers_1 = require("../helpers");
const meta_1 = require("./meta");
const messages = {
    accessLevel: (param) => `Make sure granting ${param} access is safe here.`,
    unrestricted: 'Make sure allowing unrestricted access to objects from this bucket is safe here.',
};
const ACCESS_CONTROL_KEY = 'accessControl';
const INVALID_ACCESS_CONTROL_VALUES = ['PUBLIC_READ', 'PUBLIC_READ_WRITE', 'AUTHENTICATED_READ'];
const PUBLIC_READ_ACCESS_KEY = 'publicReadAccess';
const INVALID_PUBLIC_READ_ACCESS_VALUE = true;
exports.rule = {
    meta: (0, helpers_1.generateMeta)(meta_1.meta, undefined, true),
    create(context) {
        return (0, helpers_1.mergeRules)(s3BucketConstructorRule.create(context), s3BucketDeploymentConstructorRule.create(context), handleGrantPublicAccess.create(context));
    },
};
const s3BucketConstructorRule = (0, helpers_1.S3BucketTemplate)((bucketConstructor, context) => {
    for (const value of INVALID_ACCESS_CONTROL_VALUES) {
        checkConstantParam(context, bucketConstructor, ACCESS_CONTROL_KEY, [
            'BucketAccessControl',
            value,
        ]);
    }
    checkBooleanParam(context, bucketConstructor, PUBLIC_READ_ACCESS_KEY, INVALID_PUBLIC_READ_ACCESS_VALUE);
});
const s3BucketDeploymentConstructorRule = {
    create(context) {
        return {
            NewExpression: (node) => {
                if ((0, helpers_1.isS3BucketDeploymentConstructor)(context, node)) {
                    for (const value of INVALID_ACCESS_CONTROL_VALUES) {
                        checkConstantParam(context, node, ACCESS_CONTROL_KEY, ['BucketAccessControl', value]);
                    }
                }
            },
        };
    },
};
function checkBooleanParam(context, bucketConstructor, propName, propValue) {
    const property = (0, helpers_1.getBucketProperty)(context, bucketConstructor, propName);
    if (property == null) {
        return;
    }
    const propertyLiteralValue = (0, helpers_1.getValueOfExpression)(context, property.value, 'Literal');
    if (propertyLiteralValue?.value === propValue) {
        const secondary = (0, helpers_1.findPropagatedSetting)(property, propertyLiteralValue);
        (0, helpers_1.report)(context, {
            message: messages.unrestricted,
            node: property,
        }, secondary ? [secondary] : []);
    }
}
function checkConstantParam(context, bucketConstructor, propName, paramQualifiers) {
    const property = (0, helpers_1.getBucketProperty)(context, bucketConstructor, propName);
    if (property == null) {
        return;
    }
    const propertyLiteralValue = (0, helpers_1.getValueOfExpression)(context, property.value, 'MemberExpression');
    if (propertyLiteralValue !== undefined &&
        (0, helpers_1.normalizeFQN)((0, helpers_1.getFullyQualifiedName)(context, propertyLiteralValue)) ===
            `aws_cdk_lib.aws_s3.${paramQualifiers.join('.')}`) {
        const secondary = (0, helpers_1.findPropagatedSetting)(property, propertyLiteralValue);
        (0, helpers_1.report)(context, {
            message: messages.accessLevel(paramQualifiers[paramQualifiers.length - 1]),
            node: property,
        }, secondary ? [secondary] : []);
    }
}
const handleGrantPublicAccess = {
    create(context) {
        return {
            CallExpression: (node) => {
                if (!(0, helpers_1.isMethodCall)(node)) {
                    return;
                }
                const { object, property } = node.callee;
                const isGrantPublicAccessMethodCall = (0, helpers_1.isIdentifier)(property, 'grantPublicAccess');
                if (!isGrantPublicAccessMethodCall) {
                    return;
                }
                const variableAssignment = (0, helpers_1.getUniqueWriteUsageOrNode)(context, object);
                const isS3bucketInstance = variableAssignment.type === 'NewExpression' &&
                    (0, helpers_1.isS3BucketConstructor)(context, variableAssignment);
                if (!isS3bucketInstance) {
                    return;
                }
                (0, helpers_1.report)(context, {
                    message: messages.unrestricted,
                    node: property,
                });
            },
        };
    },
};
//# sourceMappingURL=rule.js.map