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
// https://sonarsource.github.io/rspec/#/rspec/S3801/javascript
Object.defineProperty(exports, "__esModule", { value: true });
exports.rule = void 0;
const helpers_1 = require("../helpers");
const meta_1 = require("./meta");
exports.rule = {
    meta: (0, helpers_1.generateMeta)(meta_1.meta, undefined, true),
    create(context) {
        const sourceCode = context.sourceCode;
        const functionContextStack = [];
        const checkOnFunctionExit = (node) => checkFunctionLikeDeclaration(node, functionContextStack[functionContextStack.length - 1]);
        function checkFunctionLikeDeclaration(node, functionContext) {
            if (!functionContext ||
                (!!node.returnType &&
                    declaredReturnTypeContainsVoidOrNeverTypes(node.returnType.typeAnnotation))) {
                return;
            }
            checkFunctionForImplicitReturn(functionContext);
            if (hasInconsistentReturns(functionContext)) {
                const secondaryLocations = getSecondaryLocations(functionContext, node);
                (0, helpers_1.report)(context, {
                    message: `Refactor this function to use "return" consistently.`,
                    loc: (0, helpers_1.getMainFunctionTokenLocation)(node, (0, helpers_1.getParent)(context, node), context),
                }, secondaryLocations);
            }
        }
        function checkFunctionForImplicitReturn(functionContext) {
            // As this method is called at the exit point of a function definition, the current
            // segments are the ones leading to the exit point at the end of the function. If they
            // are reachable, it means there is an implicit return.
            functionContext.containsImplicitReturn = functionContext.codePath.currentSegments.some(segment => segment.reachable);
        }
        function getSecondaryLocations(functionContext, node) {
            const secondaryLocations = functionContext.returnStatements
                .slice()
                .map(returnStatement => (0, helpers_1.toSecondaryLocation)(returnStatement, returnStatement.argument ? 'Return with value' : 'Return without value'));
            if (functionContext.containsImplicitReturn) {
                const closeCurlyBraceToken = sourceCode.getLastToken(node, token => token.value === '}');
                if (!!closeCurlyBraceToken) {
                    secondaryLocations.push((0, helpers_1.toSecondaryLocation)(closeCurlyBraceToken, 'Implicit return without value'));
                }
            }
            return secondaryLocations;
        }
        return {
            onCodePathStart(codePath) {
                functionContextStack.push({
                    codePath,
                    containsReturnWithValue: false,
                    containsReturnWithoutValue: false,
                    containsImplicitReturn: false,
                    returnStatements: [],
                });
            },
            onCodePathEnd() {
                functionContextStack.pop();
            },
            ReturnStatement(node) {
                const currentContext = functionContextStack[functionContextStack.length - 1];
                if (!!currentContext) {
                    const returnStatement = node;
                    currentContext.containsReturnWithValue =
                        currentContext.containsReturnWithValue || !!returnStatement.argument;
                    currentContext.containsReturnWithoutValue =
                        currentContext.containsReturnWithoutValue || !returnStatement.argument;
                    currentContext.returnStatements.push(returnStatement);
                }
            },
            'FunctionDeclaration:exit': checkOnFunctionExit,
            'FunctionExpression:exit': checkOnFunctionExit,
            'ArrowFunctionExpression:exit': checkOnFunctionExit,
        };
    },
};
function hasInconsistentReturns(functionContext) {
    return (functionContext.containsReturnWithValue &&
        (functionContext.containsReturnWithoutValue || functionContext.containsImplicitReturn));
}
function declaredReturnTypeContainsVoidOrNeverTypes(returnTypeNode) {
    return (isVoidType(returnTypeNode) ||
        (returnTypeNode.type === 'TSUnionType' &&
            returnTypeNode.types.some(declaredReturnTypeContainsVoidOrNeverTypes)));
}
function isVoidType(typeNode) {
    return (typeNode.type === 'TSUndefinedKeyword' ||
        typeNode.type === 'TSVoidKeyword' ||
        typeNode.type === 'TSNeverKeyword');
}
//# sourceMappingURL=rule.js.map