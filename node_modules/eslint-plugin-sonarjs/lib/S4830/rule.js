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
// https://sonarsource.github.io/rspec/#/rspec/S4830/javascript
Object.defineProperty(exports, "__esModule", { value: true });
exports.rule = void 0;
const helpers_1 = require("../helpers");
const meta_1 = require("./meta");
exports.rule = {
    meta: (0, helpers_1.generateMeta)(meta_1.meta, undefined, true),
    create(context) {
        const MESSAGE = 'Enable server certificate validation on this SSL/TLS connection.';
        const SECONDARY_MESSAGE = 'Set "rejectUnauthorized" to "true".';
        function checkSensitiveArgument(callExpression, sensitiveArgumentIndex) {
            if (callExpression.arguments.length < sensitiveArgumentIndex + 1) {
                return;
            }
            const sensitiveArgument = callExpression.arguments[sensitiveArgumentIndex];
            const secondaryLocations = [];
            const argumentValue = (0, helpers_1.getValueOfExpression)(context, sensitiveArgument, 'ObjectExpression');
            if (!argumentValue) {
                return;
            }
            if (sensitiveArgument !== argumentValue) {
                secondaryLocations.push((0, helpers_1.toSecondaryLocation)(argumentValue));
            }
            const unsafeRejectUnauthorizedConfiguration = (0, helpers_1.getPropertyWithValue)(context, argumentValue, 'rejectUnauthorized', false);
            if (unsafeRejectUnauthorizedConfiguration) {
                secondaryLocations.push((0, helpers_1.toSecondaryLocation)(unsafeRejectUnauthorizedConfiguration, SECONDARY_MESSAGE));
                (0, helpers_1.report)(context, {
                    node: callExpression.callee,
                    message: MESSAGE,
                }, secondaryLocations);
            }
        }
        return {
            CallExpression: (node) => {
                const callExpression = node;
                const fqn = (0, helpers_1.getFullyQualifiedName)(context, callExpression);
                if (fqn === 'https.request') {
                    checkSensitiveArgument(callExpression, 0);
                }
                if (fqn === 'request.get') {
                    checkSensitiveArgument(callExpression, 0);
                }
                if (fqn === 'tls.connect') {
                    checkSensitiveArgument(callExpression, 2);
                }
            },
        };
    },
};
//# sourceMappingURL=rule.js.map