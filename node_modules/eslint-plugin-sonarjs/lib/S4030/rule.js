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
// https://sonarsource.github.io/rspec/#/rspec/S4030
Object.defineProperty(exports, "__esModule", { value: true });
exports.rule = void 0;
const helpers_1 = require("../helpers");
const meta_1 = require("./meta");
exports.rule = {
    meta: (0, helpers_1.generateMeta)(meta_1.meta, {
        messages: {
            unusedCollection: "Either use this collection's contents or remove the collection.",
        },
    }),
    create(context) {
        return {
            'Program:exit': (node) => {
                const unusedArrays = [];
                collectUnusedCollections(context.sourceCode.getScope(node), unusedArrays);
                unusedArrays.forEach(unusedArray => {
                    context.report({
                        messageId: 'unusedCollection',
                        node: unusedArray.identifiers[0],
                    });
                });
            },
        };
    },
};
function collectUnusedCollections(scope, unusedArray) {
    if (scope.type !== 'global') {
        scope.variables.filter(isUnusedCollection).forEach(v => {
            unusedArray.push(v);
        });
    }
    scope.childScopes.forEach(childScope => {
        collectUnusedCollections(childScope, unusedArray);
    });
}
function isExported(variable) {
    const definition = variable.defs[0];
    return definition && definition.node.parent?.parent?.type.startsWith('Export');
}
function isUnusedCollection(variable) {
    if (isExported(variable)) {
        return false;
    }
    if (variable.references.length <= 1) {
        return false;
    }
    let assignCollection = false;
    for (const ref of variable.references) {
        if (ref.isWriteOnly()) {
            if (isReferenceAssigningCollection(ref)) {
                assignCollection = true;
            }
            else {
                //One assignment is not a collection, we don't go further
                return false;
            }
        }
        else if (isRead(ref)) {
            //Unfortunately, isRead (!isWrite) from Scope.Reference consider A[1] = 1; and A.xxx(); as a read operation, we need to filter further
            return false;
        }
    }
    return assignCollection;
}
function isReferenceAssigningCollection(ref) {
    const declOrExprStmt = (0, helpers_1.findFirstMatchingAncestor)(ref.identifier, n => n.type === 'VariableDeclarator' || n.type === 'ExpressionStatement');
    if (declOrExprStmt) {
        if (declOrExprStmt.type === 'VariableDeclarator' && declOrExprStmt.init) {
            return isCollectionType(declOrExprStmt.init);
        }
        if (declOrExprStmt.type === 'ExpressionStatement') {
            const { expression } = declOrExprStmt;
            return (expression.type === 'AssignmentExpression' &&
                isReferenceTo(ref, expression.left) &&
                isCollectionType(expression.right));
        }
    }
    return false;
}
function isCollectionType(node) {
    if (node && node.type === 'ArrayExpression') {
        return true;
    }
    else if (node && (node.type === 'CallExpression' || node.type === 'NewExpression')) {
        return (0, helpers_1.isIdentifier)(node.callee, ...helpers_1.collectionConstructor);
    }
    return false;
}
function isRead(ref) {
    const expressionStatement = (0, helpers_1.findFirstMatchingAncestor)(ref.identifier, n => n.type === 'ExpressionStatement');
    if (expressionStatement) {
        return !((0, helpers_1.isElementWrite)(expressionStatement, ref, false) ||
            isWritingMethodCall(expressionStatement, ref));
    }
    //All the write statement that we search are part of ExpressionStatement, if there is none, it's a read
    return true;
}
/**
 * Detect expression statements like the following:
 * myArray.push(1);
 */
function isWritingMethodCall(statement, ref) {
    if (statement.expression.type === 'CallExpression') {
        const { callee } = statement.expression;
        if (callee.type === 'MemberExpression') {
            const { property } = callee;
            return isReferenceTo(ref, callee.object) && (0, helpers_1.isIdentifier)(property, ...helpers_1.writingMethods);
        }
    }
    return false;
}
function isReferenceTo(ref, node) {
    return node.type === 'Identifier' && node === ref.identifier;
}
//# sourceMappingURL=rule.js.map