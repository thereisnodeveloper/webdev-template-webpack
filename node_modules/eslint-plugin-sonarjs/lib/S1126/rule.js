"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rule = void 0;
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
// https://sonarsource.github.io/rspec/#/rspec/S1126
const utils_1 = require("@typescript-eslint/utils");
const helpers_1 = require("../helpers");
const meta_1 = require("./meta");
exports.rule = {
    meta: (0, helpers_1.generateMeta)(meta_1.meta, {
        messages: {
            replaceIfThenElseByReturn: 'Replace this if-then-else flow by a single return statement.',
            suggest: 'Replace with single return statement',
            suggestCast: 'Replace with single return statement using "!!" cast',
            suggestBoolean: 'Replace with single return statement without cast (condition should be boolean!)',
        },
        hasSuggestions: true,
    }),
    create(context) {
        return {
            IfStatement(node) {
                const parent = node.parent;
                if (
                // ignore `else if`
                parent.type !== utils_1.AST_NODE_TYPES.IfStatement &&
                    returnsBoolean(node.consequent) &&
                    alternateReturnsBoolean(node)) {
                    context.report({
                        messageId: 'replaceIfThenElseByReturn',
                        node,
                        suggest: getSuggestion(node, parent),
                    });
                }
            },
        };
        function alternateReturnsBoolean(node) {
            if (node.alternate) {
                return returnsBoolean(node.alternate);
            }
            const { parent } = node;
            if (parent?.type === utils_1.AST_NODE_TYPES.BlockStatement) {
                const ifStmtIndex = parent.body.findIndex(stmt => stmt === node);
                return isSimpleReturnBooleanLiteral(parent.body[ifStmtIndex + 1]);
            }
            return false;
        }
        function returnsBoolean(statement) {
            return (statement !== undefined &&
                (isBlockReturningBooleanLiteral(statement) || isSimpleReturnBooleanLiteral(statement)));
        }
        function isBlockReturningBooleanLiteral(statement) {
            return (statement.type === utils_1.AST_NODE_TYPES.BlockStatement &&
                statement.body.length === 1 &&
                isSimpleReturnBooleanLiteral(statement.body[0]));
        }
        function isSimpleReturnBooleanLiteral(statement) {
            return (statement?.type === utils_1.AST_NODE_TYPES.ReturnStatement &&
                statement.argument?.type === utils_1.AST_NODE_TYPES.Literal &&
                typeof statement.argument.value === 'boolean');
        }
        function getSuggestion(ifStmt, parent) {
            const getFix = (condition) => {
                return (fixer) => {
                    const singleReturn = `return ${condition};`;
                    if (ifStmt.alternate) {
                        return fixer.replaceText(ifStmt, singleReturn);
                    }
                    else {
                        const ifStmtIndex = parent.body.findIndex(stmt => stmt === ifStmt);
                        const returnStmt = parent.body[ifStmtIndex + 1];
                        const range = [ifStmt.range[0], returnStmt.range[1]];
                        return fixer.replaceTextRange(range, singleReturn);
                    }
                };
            };
            const shouldNegate = isReturningFalse(ifStmt.consequent);
            const shouldCast = !isBooleanExpression(ifStmt.test);
            const testText = context.sourceCode.getText(ifStmt.test);
            if (shouldNegate) {
                return [{ messageId: 'suggest', fix: getFix(`!(${testText})`) }];
            }
            else if (!shouldCast) {
                return [{ messageId: 'suggest', fix: getFix(testText) }];
            }
            else {
                return [
                    { messageId: 'suggestCast', fix: getFix(`!!(${testText})`) },
                    { messageId: 'suggestBoolean', fix: getFix(testText) },
                ];
            }
        }
        function isReturningFalse(stmt) {
            const returnStmt = (stmt.type === utils_1.AST_NODE_TYPES.BlockStatement ? stmt.body[0] : stmt);
            return returnStmt.argument.value === false;
        }
        function isBooleanExpression(expr) {
            return ((expr.type === utils_1.AST_NODE_TYPES.UnaryExpression ||
                expr.type === utils_1.AST_NODE_TYPES.BinaryExpression) &&
                ['!', '==', '===', '!=', '!==', '<', '<=', '>', '>=', 'in', 'instanceof'].includes(expr.operator));
        }
    },
};
//# sourceMappingURL=rule.js.map