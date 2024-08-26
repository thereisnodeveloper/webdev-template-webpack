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
// https://sonarsource.github.io/rspec/#/rspec/S2589
Object.defineProperty(exports, "__esModule", { value: true });
exports.rule = void 0;
const helpers_1 = require("../helpers");
const meta_1 = require("./meta");
const message = 'This always evaluates to {{value}}. Consider refactoring this code.';
exports.rule = {
    meta: (0, helpers_1.generateMeta)(meta_1.meta, {
        messages: {
            refactorBooleanExpression: message,
        },
    }, true),
    create(context) {
        const truthyMap = new Map();
        const falsyMap = new Map();
        function isInsideJSX(node) {
            const ancestors = context.sourceCode.getAncestors(node);
            return !!ancestors.find(ancestor => ancestor.type === 'JSXExpressionContainer');
        }
        return {
            IfStatement: (node) => {
                const { test } = node;
                if (test.type === 'Literal' && typeof test.value === 'boolean') {
                    reportIssue(test, undefined, context, test.value);
                }
            },
            ':statement': (node) => {
                const { parent } = node;
                if ((0, helpers_1.isIfStatement)(parent)) {
                    // we visit 'consequent' and 'alternate' and not if-statement directly in order to get scope for 'consequent'
                    const currentScope = context.sourceCode.getScope(node);
                    if (parent.consequent === node) {
                        const { truthy, falsy } = collectKnownIdentifiers(parent.test);
                        truthyMap.set(parent.consequent, transformAndFilter(truthy, currentScope));
                        falsyMap.set(parent.consequent, transformAndFilter(falsy, currentScope));
                    }
                    else if (parent.alternate === node && (0, helpers_1.isIdentifier)(parent.test)) {
                        falsyMap.set(parent.alternate, transformAndFilter([parent.test], currentScope));
                    }
                }
            },
            ':statement:exit': (node) => {
                const stmt = node;
                truthyMap.delete(stmt);
                falsyMap.delete(stmt);
            },
            Identifier: (node) => {
                const id = node;
                const symbol = getSymbol(id, context.sourceCode.getScope(node));
                const { parent } = node;
                if (!symbol || !parent || (isInsideJSX(node) && isLogicalAndRhs(id, parent))) {
                    return;
                }
                if (!isLogicalAnd(parent) &&
                    !isLogicalOrLhs(id, parent) &&
                    !(0, helpers_1.isIfStatement)(parent) &&
                    !isLogicalNegation(parent)) {
                    return;
                }
                const checkIfKnownAndReport = (map, truthy) => {
                    map.forEach(references => {
                        const ref = references.find(ref => ref.resolved === symbol);
                        if (ref) {
                            reportIssue(id, ref, context, truthy);
                        }
                    });
                };
                checkIfKnownAndReport(truthyMap, true);
                checkIfKnownAndReport(falsyMap, false);
            },
            Program: () => {
                truthyMap.clear();
                falsyMap.clear();
            },
        };
    },
};
function collectKnownIdentifiers(expression) {
    const truthy = [];
    const falsy = [];
    const checkExpr = (expr) => {
        if ((0, helpers_1.isIdentifier)(expr)) {
            truthy.push(expr);
        }
        else if (isLogicalNegation(expr)) {
            if ((0, helpers_1.isIdentifier)(expr.argument)) {
                falsy.push(expr.argument);
            }
            else if (isLogicalNegation(expr.argument) && (0, helpers_1.isIdentifier)(expr.argument.argument)) {
                truthy.push(expr.argument.argument);
            }
        }
    };
    let current = expression;
    checkExpr(current);
    while (isLogicalAnd(current)) {
        checkExpr(current.right);
        current = current.left;
    }
    checkExpr(current);
    return { truthy, falsy };
}
function isLogicalAnd(expression) {
    return expression.type === 'LogicalExpression' && expression.operator === '&&';
}
function isLogicalOrLhs(id, expression) {
    return (expression.type === 'LogicalExpression' &&
        expression.operator === '||' &&
        expression.left === id);
}
function isLogicalAndRhs(id, expression) {
    return (expression.parent?.type !== 'LogicalExpression' &&
        expression.type === 'LogicalExpression' &&
        expression.operator === '&&' &&
        expression.right === id);
}
function isLogicalNegation(expression) {
    return expression.type === 'UnaryExpression' && expression.operator === '!';
}
function isDefined(x) {
    return x != null;
}
function getSymbol(id, scope) {
    const ref = scope.references.find(r => r.identifier === id);
    if (ref) {
        return ref.resolved;
    }
    return null;
}
function getFunctionScope(scope) {
    if (scope.type === 'function') {
        return scope;
    }
    else if (!scope.upper) {
        return null;
    }
    return getFunctionScope(scope.upper);
}
function mightBeWritten(symbol, currentScope) {
    return symbol.references
        .filter(ref => ref.isWrite())
        .find(ref => {
        const refScope = ref.from;
        let cur = refScope;
        while (cur) {
            if (cur === currentScope) {
                return true;
            }
            cur = cur.upper;
        }
        const currentFunc = getFunctionScope(currentScope);
        const refFunc = getFunctionScope(refScope);
        return refFunc !== currentFunc;
    });
}
function transformAndFilter(ids, currentScope) {
    return ids
        .map(id => currentScope.upper?.references.find(r => r.identifier === id))
        .filter(isDefined)
        .filter(ref => isDefined(ref.resolved))
        .filter(ref => !mightBeWritten(ref.resolved, currentScope));
}
function reportIssue(id, ref, context, truthy) {
    const value = truthy ? 'truthy' : 'falsy';
    (0, helpers_1.report)(context, {
        message,
        data: {
            value,
        },
        node: id,
    }, ref?.identifier ? [(0, helpers_1.toSecondaryLocation)(ref.identifier, `Evaluated here to be ${value}`)] : []);
}
//# sourceMappingURL=rule.js.map