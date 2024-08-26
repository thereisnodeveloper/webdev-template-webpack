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
// https://sonarsource.github.io/rspec/#/rspec/S1488
Object.defineProperty(exports, "__esModule", { value: true });
exports.rule = void 0;
const utils_1 = require("@typescript-eslint/utils");
const helpers_1 = require("../helpers");
const meta_1 = require("./meta");
exports.rule = {
    meta: (0, helpers_1.generateMeta)(meta_1.meta, {
        messages: {
            doImmediateAction: 'Immediately {{action}} this expression instead of assigning it to the temporary variable "{{variable}}".',
        },
        fixable: 'code',
    }),
    create(context) {
        return {
            BlockStatement(node) {
                processStatements(node, node.body);
            },
            SwitchCase(node) {
                processStatements(node, node.consequent);
            },
        };
        function processStatements(node, statements) {
            if (statements.length > 1) {
                const last = statements[statements.length - 1];
                const returnedIdentifier = getOnlyReturnedVariable(last);
                const lastButOne = statements[statements.length - 2];
                const declaredIdentifier = getOnlyDeclaredVariable(lastButOne);
                if (returnedIdentifier && declaredIdentifier) {
                    const sameVariable = getVariables(node, context).find(variable => {
                        return (variable.references.find(ref => ref.identifier === returnedIdentifier) !==
                            undefined &&
                            variable.references.find(ref => ref.identifier === declaredIdentifier.id) !==
                                undefined);
                    });
                    // there must be only one "read" - in `return` or `throw`
                    if (sameVariable && sameVariable.references.filter(ref => ref.isRead()).length === 1) {
                        context.report({
                            messageId: 'doImmediateAction',
                            data: {
                                action: last.type === utils_1.AST_NODE_TYPES.ReturnStatement ? 'return' : 'throw',
                                variable: returnedIdentifier.name,
                            },
                            node: declaredIdentifier.init,
                            fix: fixer => fix(fixer, last, lastButOne, declaredIdentifier.init, returnedIdentifier),
                        });
                    }
                }
            }
        }
        function fix(fixer, last, lastButOne, expressionToReturn, returnedExpression) {
            const expressionText = context.sourceCode.getText(expressionToReturn);
            const rangeToRemoveStart = lastButOne.range[0];
            const commentsBetweenStatements = context.sourceCode.getCommentsAfter(lastButOne);
            const rangeToRemoveEnd = commentsBetweenStatements.length > 0
                ? commentsBetweenStatements[0].range[0]
                : last.range[0];
            return [
                fixer.removeRange([rangeToRemoveStart, rangeToRemoveEnd]),
                fixer.replaceText(returnedExpression, expressionText),
            ];
        }
        function getOnlyReturnedVariable(node) {
            return (node.type === utils_1.AST_NODE_TYPES.ReturnStatement ||
                node.type === utils_1.AST_NODE_TYPES.ThrowStatement) &&
                node.argument &&
                (0, helpers_1.isIdentifier)(node.argument)
                ? node.argument
                : undefined;
        }
        function getOnlyDeclaredVariable(node) {
            if (node.type === utils_1.AST_NODE_TYPES.VariableDeclaration && node.declarations.length === 1) {
                const { id, init } = node.declarations[0];
                if (id.type === utils_1.AST_NODE_TYPES.Identifier &&
                    init &&
                    !id.typeAnnotation) {
                    return { id, init };
                }
            }
            return undefined;
        }
        function getVariables(node, context) {
            const { variableScope, variables: currentScopeVariables } = context.sourceCode.getScope(node);
            if (variableScope === context.sourceCode.getScope(node)) {
                return currentScopeVariables;
            }
            else {
                return currentScopeVariables.concat(variableScope.variables);
            }
        }
    },
};
//# sourceMappingURL=rule.js.map