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
// https://sonarsource.github.io/rspec/#/rspec/S6252/javascript
Object.defineProperty(exports, "__esModule", { value: true });
exports.rule = void 0;
const helpers_1 = require("../helpers");
const meta_1 = require("./meta");
const VERSIONED_KEY = 'versioned';
const messages = {
    unversioned: 'Make sure using unversioned S3 bucket is safe here.',
    omitted: 'Omitting the "versioned" argument disables S3 bucket versioning. Make sure it is safe here.',
    secondary: 'Propagated setting',
};
exports.rule = (0, helpers_1.S3BucketTemplate)((bucketConstructor, context) => {
    const versionedProperty = (0, helpers_1.getBucketProperty)(context, bucketConstructor, VERSIONED_KEY);
    if (versionedProperty == null) {
        (0, helpers_1.report)(context, {
            message: messages.omitted,
            node: bucketConstructor.callee,
        });
        return;
    }
    const propertyLiteralValue = (0, helpers_1.getValueOfExpression)(context, versionedProperty.value, 'Literal');
    if (propertyLiteralValue?.value === false) {
        const secondaries = [];
        const isPropagatedProperty = versionedProperty.value !== propertyLiteralValue;
        if (isPropagatedProperty) {
            secondaries.push((0, helpers_1.toSecondaryLocation)((0, helpers_1.getNodeParent)(propertyLiteralValue), messages.secondary));
        }
        (0, helpers_1.report)(context, {
            message: messages.unversioned,
            node: versionedProperty,
        }, secondaries);
    }
}, (0, helpers_1.generateMeta)(meta_1.meta, undefined, true));
//# sourceMappingURL=rule.js.map