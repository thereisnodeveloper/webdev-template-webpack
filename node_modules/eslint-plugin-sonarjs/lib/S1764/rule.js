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
// https://sonarsource.github.io/rspec/#/rspec/S1764
Object.defineProperty(exports, "__esModule", { value: true });
exports.rule = void 0;
const helpers_1 = require("../helpers");
const meta_1 = require("./meta");
const EQUALITY_OPERATOR_TOKEN_KINDS = new Set(['==', '===', '!=', '!==']);
// consider only binary expressions with these operators
const RELEVANT_OPERATOR_TOKEN_KINDS = new Set([
    '&&',
    '||',
    '/',
    '-',
    '<<',
    '>>',
    '<',
    '<=',
    '>',
    '>=',
]);
function hasRelevantOperator(node) {
    return (RELEVANT_OPERATOR_TOKEN_KINDS.has(node.operator) ||
        (EQUALITY_OPERATOR_TOKEN_KINDS.has(node.operator) && !hasIdentifierOperands(node)));
}
function hasIdentifierOperands(node) {
    return (0, helpers_1.isIdentifier)(node.left) && (0, helpers_1.isIdentifier)(node.right);
}
function isOneOntoOneShifting(node) {
    return (node.operator === '<<' &&
        (0, helpers_1.isLiteral)(node.left) &&
        (node.left.value === 1 || node.left.value === 1n));
}
const message = 'Correct one of the identical sub-expressions on both sides of operator "{{operator}}"';
exports.rule = {
    meta: (0, helpers_1.generateMeta)(meta_1.meta, {
        messages: {
            correctIdenticalSubExpressions: message,
        },
    }, true),
    create(context) {
        return {
            LogicalExpression(node) {
                check(node);
            },
            BinaryExpression(node) {
                check(node);
            },
        };
        function check(expr) {
            if (hasRelevantOperator(expr) &&
                !isOneOntoOneShifting(expr) &&
                (0, helpers_1.areEquivalent)(expr.left, expr.right, context.sourceCode)) {
                const secondaryLocations = [];
                if (expr.left.loc) {
                    secondaryLocations.push((0, helpers_1.toSecondaryLocation)(expr.left));
                }
                (0, helpers_1.report)(context, {
                    message,
                    messageId: 'correctIdenticalSubExpressions',
                    data: {
                        operator: expr.operator,
                    },
                    node: isSonarRuntime() ? expr.right : expr,
                }, secondaryLocations);
            }
        }
        function isSonarRuntime() {
            return context.options[context.options.length - 1] === 'sonar-runtime';
        }
    },
};
//# sourceMappingURL=rule.js.map