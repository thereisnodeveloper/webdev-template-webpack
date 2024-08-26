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
// https://sonarsource.github.io/rspec/#/rspec/S1067/javascript
Object.defineProperty(exports, "__esModule", { value: true });
exports.rule = void 0;
const helpers_1 = require("../helpers");
const meta_1 = require("./meta");
const DEFAULT = 3;
exports.rule = {
    meta: (0, helpers_1.generateMeta)(meta_1.meta, { schema: meta_1.schema }, true),
    create(context) {
        const threshold = context.options[0]?.max ?? DEFAULT;
        const statementLevel = [new ExpressionComplexity()];
        return {
            '*': (node) => {
                const tree = node;
                if (isConditionalLike(tree)) {
                    const expr = statementLevel[statementLevel.length - 1];
                    expr.incrementNestedExprLevel();
                    expr.addOperator(getOperatorToken(tree, context));
                }
                else if (isScopeLike(tree)) {
                    statementLevel.push(new ExpressionComplexity());
                }
            },
            '*:exit': (node) => {
                const tree = node;
                if (isConditionalLike(tree)) {
                    const expr = statementLevel[statementLevel.length - 1];
                    expr.decrementNestedExprLevel();
                    if (expr.isOnFirstExprLevel()) {
                        const operators = expr.getComplexityOperators();
                        if (operators.length > threshold) {
                            reportIssue(tree, operators, threshold, context);
                        }
                        expr.resetExpressionComplexityOperators();
                    }
                }
                else if (isScopeLike(tree)) {
                    statementLevel.pop();
                }
            },
        };
    },
};
class ExpressionComplexity {
    constructor() {
        this.nestedLevel = 0;
        this.operators = [];
    }
    addOperator(operator) {
        this.operators.push(operator);
    }
    incrementNestedExprLevel() {
        this.nestedLevel++;
    }
    decrementNestedExprLevel() {
        this.nestedLevel--;
    }
    isOnFirstExprLevel() {
        return this.nestedLevel === 0;
    }
    getComplexityOperators() {
        return this.operators;
    }
    resetExpressionComplexityOperators() {
        this.operators = [];
    }
}
function isScopeLike(node) {
    return (node.type === 'FunctionExpression' ||
        (node.type === 'FunctionDeclaration' && node.generator) ||
        node.type === 'ObjectExpression' ||
        node.type === 'CallExpression' ||
        node.type === 'JSXElement');
}
function isConditionalLike(node) {
    return node.type === 'ConditionalExpression' || node.type === 'LogicalExpression';
}
function getOperatorToken(node, context) {
    const sourceCode = context.sourceCode;
    if (node.type === 'ConditionalExpression') {
        return sourceCode.getTokenAfter(node.test, token => token.type === 'Punctuator' && token.value === '?');
    }
    else {
        const expr = node;
        return sourceCode.getTokenAfter(expr.left, token => token.type === 'Punctuator' && token.value === expr.operator);
    }
}
function reportIssue(node, operators, max, context) {
    const complexity = operators.length;
    const cost = complexity - max;
    (0, helpers_1.report)(context, {
        node: node,
        message: `Reduce the number of conditional operators (${complexity}) used in the expression (maximum allowed ${max}).`,
    }, operators.map(node => (0, helpers_1.toSecondaryLocation)(node, '+1')), cost);
}
//# sourceMappingURL=rule.js.map