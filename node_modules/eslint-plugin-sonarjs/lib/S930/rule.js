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
// https://sonarsource.github.io/rspec/#/rspec/S930
Object.defineProperty(exports, "__esModule", { value: true });
exports.rule = void 0;
const utils_1 = require("@typescript-eslint/utils");
const helpers_1 = require("../helpers");
const meta_1 = require("./meta");
const message = 'This function expects {{expectedArguments}}, but {{providedArguments}} provided.';
exports.rule = {
    meta: (0, helpers_1.generateMeta)(meta_1.meta, {
        messages: {
            tooManyArguments: message,
        },
    }, true),
    create(context) {
        const callExpressionsToCheck = [];
        const usingArguments = new Set();
        const emptyFunctions = new Set();
        return {
            CallExpression(callExpr) {
                if ((0, helpers_1.isIdentifier)(callExpr.callee)) {
                    const reference = context.sourceCode
                        .getScope(callExpr)
                        .references.find(ref => ref.identifier === callExpr.callee);
                    const definition = reference && getSingleDefinition(reference);
                    if (definition) {
                        if (definition.type === 'FunctionName') {
                            checkFunction(callExpr, definition.node);
                        }
                        else if (definition.type === 'Variable') {
                            const { init } = definition.node;
                            if (init && ((0, helpers_1.isFunctionExpression)(init) || (0, helpers_1.isArrowFunctionExpression)(init))) {
                                checkFunction(callExpr, init);
                            }
                        }
                    }
                }
                else if ((0, helpers_1.isArrowFunctionExpression)(callExpr.callee) ||
                    (0, helpers_1.isFunctionExpression)(callExpr.callee)) {
                    // IIFE
                    checkFunction(callExpr, callExpr.callee);
                }
            },
            ':function'(node) {
                const fn = node;
                if (fn.body.type === utils_1.AST_NODE_TYPES.BlockStatement &&
                    fn.body.body.length === 0 &&
                    fn.params.length === 0) {
                    emptyFunctions.add(node);
                }
            },
            'FunctionDeclaration > BlockStatement Identifier'(node) {
                checkArguments(node);
            },
            'FunctionExpression > BlockStatement Identifier'(node) {
                checkArguments(node);
            },
            'Program:exit'() {
                callExpressionsToCheck.forEach(({ callExpr, functionNode }) => {
                    if (!usingArguments.has(functionNode) && !emptyFunctions.has(functionNode)) {
                        reportIssue(callExpr, functionNode);
                    }
                });
            },
        };
        function getSingleDefinition(reference) {
            if (reference.resolved) {
                const variable = reference.resolved;
                if (variable.defs.length === 1) {
                    return variable.defs[0];
                }
            }
            return undefined;
        }
        function checkArguments(identifier) {
            if (identifier.name === 'arguments') {
                const reference = context.sourceCode
                    .getScope(identifier)
                    .references.find(ref => ref.identifier === identifier);
                const definition = reference && getSingleDefinition(reference);
                // special `arguments` variable has no definition
                if (!definition) {
                    const ancestors = context.sourceCode.getAncestors(identifier).reverse();
                    const fn = ancestors.find(node => (0, helpers_1.isFunctionDeclaration)(node) ||
                        (0, helpers_1.isFunctionExpression)(node));
                    if (fn) {
                        usingArguments.add(fn);
                    }
                }
            }
        }
        function checkFunction(callExpr, functionNode) {
            const hasRest = functionNode.params.some(param => param.type === 'RestElement');
            if (!hasRest && callExpr.arguments.length > functionNode.params.length) {
                callExpressionsToCheck.push({ callExpr, functionNode });
            }
        }
        function reportIssue(callExpr, functionNode) {
            const paramLength = functionNode.params.length;
            const argsLength = callExpr.arguments.length;
            // prettier-ignore
            const expectedArguments = paramLength === 0 ? "no arguments" :
                paramLength === 1 ? "1 argument" :
                    `${paramLength} arguments`;
            // prettier-ignore
            const providedArguments = argsLength === 0 ? "none was" :
                argsLength === 1 ? "1 was" :
                    `${argsLength} were`;
            (0, helpers_1.report)(context, {
                message,
                messageId: 'tooManyArguments',
                data: {
                    expectedArguments,
                    providedArguments,
                },
                node: callExpr.callee,
            }, getSecondaryLocations(callExpr, functionNode));
        }
        function getSecondaryLocations(callExpr, functionNode) {
            const paramLength = functionNode.params.length;
            const secondaryLocations = [];
            if (paramLength > 0) {
                secondaryLocations.push((0, helpers_1.toSecondaryLocation)(functionNode.params[0], functionNode.params[paramLength - 1], 'Formal parameters'));
            }
            else {
                // as we're not providing parent node, `getMainFunctionTokenLocation` may return `undefined`
                const fnToken = (0, helpers_1.getMainFunctionTokenLocation)(functionNode, undefined, context);
                if (fnToken) {
                    secondaryLocations.push((0, helpers_1.toSecondaryLocation)({ loc: fnToken }, 'Formal parameters'));
                }
            }
            // find actual extra arguments to highlight
            callExpr.arguments.forEach((argument, index) => {
                if (index >= paramLength) {
                    const { loc } = argument;
                    secondaryLocations.push({
                        message: 'Extra argument',
                        column: loc.start.column,
                        line: loc.start.line,
                        endColumn: loc.end.column,
                        endLine: loc.end.line,
                    });
                }
            });
            return secondaryLocations;
        }
    },
};
//# sourceMappingURL=rule.js.map