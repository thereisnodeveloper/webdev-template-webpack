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
// https://sonarsource.github.io/rspec/#/rspec/S6281/javascript
Object.defineProperty(exports, "__esModule", { value: true });
exports.rule = void 0;
const helpers_1 = require("../helpers");
const meta_1 = require("./meta");
const BLOCK_PUBLIC_ACCESS_KEY = 'blockPublicAccess';
const BLOCK_PUBLIC_ACCESS_PROPERTY_KEYS = [
    'blockPublicAcls',
    'blockPublicPolicy',
    'ignorePublicAcls',
    'restrictPublicBuckets',
];
const messages = {
    omitted: 'No Public Access Block configuration prevents public ACL/policies ' +
        'to be set on this S3 bucket. Make sure it is safe here.',
    public: 'Make sure allowing public ACL/policies to be set is safe here.',
};
exports.rule = (0, helpers_1.S3BucketTemplate)((bucket, context) => {
    const blockPublicAccess = (0, helpers_1.getBucketProperty)(context, bucket, BLOCK_PUBLIC_ACCESS_KEY);
    if (blockPublicAccess == null) {
        (0, helpers_1.report)(context, {
            message: messages['omitted'],
            node: bucket.callee,
        });
    }
    else {
        checkBlockPublicAccessValue(blockPublicAccess);
        checkBlockPublicAccessConstructor(blockPublicAccess);
    }
    /** Checks `blockPublicAccess: s3.BlockPublicAccess.BLOCK_ACLS` sensitive pattern */
    function checkBlockPublicAccessValue(blockPublicAccess) {
        const blockPublicAccessMember = (0, helpers_1.getValueOfExpression)(context, blockPublicAccess.value, 'MemberExpression');
        if (blockPublicAccessMember !== undefined &&
            (0, helpers_1.normalizeFQN)((0, helpers_1.getFullyQualifiedName)(context, blockPublicAccessMember)) ===
                'aws_cdk_lib.aws_s3.BlockPublicAccess.BLOCK_ACLS') {
            const propagated = (0, helpers_1.findPropagatedSetting)(blockPublicAccess, blockPublicAccessMember);
            (0, helpers_1.report)(context, {
                message: messages['public'],
                node: blockPublicAccess,
            }, propagated ? [propagated] : []);
        }
    }
    /** Checks `blockPublicAccess: new s3.BlockPublicAccess({...})` sensitive pattern */
    function checkBlockPublicAccessConstructor(blockPublicAccess) {
        const blockPublicAccessNew = (0, helpers_1.getValueOfExpression)(context, blockPublicAccess.value, 'NewExpression');
        if (blockPublicAccessNew !== undefined &&
            isS3BlockPublicAccessConstructor(blockPublicAccessNew)) {
            const blockPublicAccessConfig = (0, helpers_1.getValueOfExpression)(context, blockPublicAccessNew.arguments[0], 'ObjectExpression');
            if (blockPublicAccessConfig === undefined) {
                (0, helpers_1.report)(context, {
                    message: messages['omitted'],
                    node: blockPublicAccessNew,
                });
            }
            else {
                BLOCK_PUBLIC_ACCESS_PROPERTY_KEYS.forEach(key => checkBlockPublicAccessConstructorProperty(blockPublicAccessConfig, key));
            }
        }
        function checkBlockPublicAccessConstructorProperty(blockPublicAccessConfig, key) {
            const blockPublicAccessProperty = blockPublicAccessConfig.properties.find(property => (0, helpers_1.isProperty)(property) && (0, helpers_1.isIdentifier)(property.key, key));
            if (blockPublicAccessProperty !== undefined) {
                const blockPublicAccessValue = (0, helpers_1.getValueOfExpression)(context, blockPublicAccessProperty.value, 'Literal');
                if (blockPublicAccessValue?.value === false) {
                    const propagated = (0, helpers_1.findPropagatedSetting)(blockPublicAccessProperty, blockPublicAccessValue);
                    (0, helpers_1.report)(context, {
                        message: messages['public'],
                        node: blockPublicAccessProperty,
                    }, propagated ? [propagated] : []);
                }
            }
        }
        function isS3BlockPublicAccessConstructor(expr) {
            return (expr.callee.type === 'MemberExpression' &&
                (0, helpers_1.normalizeFQN)((0, helpers_1.getFullyQualifiedName)(context, expr.callee)) ===
                    'aws_cdk_lib.aws_s3.BlockPublicAccess');
        }
    }
}, (0, helpers_1.generateMeta)(meta_1.meta, undefined, true));
//# sourceMappingURL=rule.js.map