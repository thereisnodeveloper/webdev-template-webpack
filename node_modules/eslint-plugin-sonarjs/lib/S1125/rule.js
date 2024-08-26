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
// https://sonarsource.github.io/rspec/#/rspec/S1125
Object.defineProperty(exports, "__esModule", { value: true });
exports.rule = void 0;
const utils_1 = require("@typescript-eslint/utils");
const helpers_1 = require("../helpers");
const meta_1 = require("./meta");
exports.rule = {
    meta: (0, helpers_1.generateMeta)(meta_1.meta, {
        messages: {
            removeUnnecessaryBoolean: 'Refactor the code to avoid using this boolean literal.',
        },
    }),
    create(context) {
        return {
            BinaryExpression(expression) {
                if (expression.operator === '==' || expression.operator === '!=') {
                    checkBooleanLiteral(expression.left);
                    checkBooleanLiteral(expression.right);
                }
            },
            LogicalExpression(expression) {
                checkBooleanLiteral(expression.left);
                if (expression.operator === '&&') {
                    checkBooleanLiteral(expression.right);
                }
                // ignore `x || true` and `x || false` expressions outside of conditional expressions and `if` statements
                const parent = expression.parent;
                if (expression.operator === '||' &&
                    ((parent.type === utils_1.AST_NODE_TYPES.ConditionalExpression && parent.test === expression) ||
                        parent.type === utils_1.AST_NODE_TYPES.IfStatement)) {
                    checkBooleanLiteral(expression.right);
                }
            },
            UnaryExpression(unaryExpression) {
                if (unaryExpression.operator === '!') {
                    checkBooleanLiteral(unaryExpression.argument);
                }
            },
        };
        function checkBooleanLiteral(expression) {
            if ((0, helpers_1.isBooleanLiteral)(expression)) {
                context.report({ messageId: 'removeUnnecessaryBoolean', node: expression });
            }
        }
    },
};
//# sourceMappingURL=rule.js.map