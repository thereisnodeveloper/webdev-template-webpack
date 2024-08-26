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
// https://sonarsource.github.io/rspec/#/rspec/S6245/javascript
Object.defineProperty(exports, "__esModule", { value: true });
exports.rule = void 0;
const helpers_1 = require("../helpers");
const meta_1 = require("./meta");
const ENCRYPTED_KEY = 'encryption';
const messages = {
    unencrypted: 'Objects in the bucket are not encrypted. Make sure it is safe here.',
    omitted: 'Omitting "encryption" disables server-side encryption. Make sure it is safe here.',
};
exports.rule = (0, helpers_1.S3BucketTemplate)((bucket, context) => {
    const encryptedProperty = (0, helpers_1.getBucketProperty)(context, bucket, ENCRYPTED_KEY);
    if (encryptedProperty == null) {
        (0, helpers_1.report)(context, {
            message: messages['omitted'],
            node: bucket.callee,
        });
        return;
    }
    const encryptedValue = (0, helpers_1.getValueOfExpression)(context, encryptedProperty.value, 'MemberExpression');
    if (encryptedValue && isUnencrypted(encryptedValue)) {
        const propagated = (0, helpers_1.findPropagatedSetting)(encryptedProperty, encryptedValue);
        (0, helpers_1.report)(context, {
            message: messages['unencrypted'],
            node: encryptedProperty,
        }, propagated ? [propagated] : []);
    }
    function isUnencrypted(encrypted) {
        return ((0, helpers_1.normalizeFQN)((0, helpers_1.getFullyQualifiedName)(context, encrypted)) ===
            'aws_cdk_lib.aws_s3.BucketEncryption.UNENCRYPTED');
    }
}, (0, helpers_1.generateMeta)(meta_1.meta, undefined, true));
//# sourceMappingURL=rule.js.map