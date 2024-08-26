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
// https://sonarsource.github.io/rspec/#/rspec/S1541/javascript
Object.defineProperty(exports, "__esModule", { value: true });
exports.rule = void 0;
const helpers_1 = require("../helpers");
const meta_1 = require("./meta");
const DEFAULT_THRESHOLD = 10;
exports.rule = {
    meta: (0, helpers_1.generateMeta)(meta_1.meta, { schema: meta_1.schema }, true),
    create(context) {
        const threshold = context.options[0]?.threshold ?? DEFAULT_THRESHOLD;
        let functionsWithParent;
        let functionsDefiningModule;
        let functionsImmediatelyInvoked;
        return {
            Program: () => {
                functionsWithParent = new Map();
                functionsDefiningModule = [];
                functionsImmediatelyInvoked = [];
            },
            'Program:exit': () => {
                functionsWithParent.forEach((parent, func) => {
                    if (!functionsDefiningModule.includes(func) &&
                        !functionsImmediatelyInvoked.includes(func)) {
                        raiseOnUnauthorizedComplexity(func, parent, threshold, context);
                    }
                });
            },
            'FunctionDeclaration, FunctionExpression, ArrowFunctionExpression': (node) => functionsWithParent.set(node, (0, helpers_1.getParent)(context, node)),
            "CallExpression[callee.type='Identifier'][callee.name='define'] FunctionExpression": (node) => functionsDefiningModule.push(node),
            "NewExpression[callee.type='FunctionExpression'], CallExpression[callee.type='FunctionExpression']": (node) => functionsImmediatelyInvoked.push(node.callee),
        };
    },
};
function raiseOnUnauthorizedComplexity(node, parent, threshold, context) {
    const tokens = computeCyclomaticComplexity(node, parent, context);
    const complexity = tokens.length;
    if (complexity > threshold) {
        context.report({
            message: toEncodedMessage(complexity, threshold, tokens),
            loc: (0, helpers_1.getMainFunctionTokenLocation)(node, parent, context),
        });
    }
}
function toEncodedMessage(complexity, threshold, tokens) {
    const encodedMessage = {
        message: `Function has a complexity of ${complexity} which is greater than ${threshold} authorized.`,
        cost: complexity - threshold,
        secondaryLocations: tokens.map(node => toSecondaryLocation(node)),
    };
    return JSON.stringify(encodedMessage);
}
function toSecondaryLocation(token) {
    return {
        line: token.loc.start.line,
        column: token.loc.start.column,
        endLine: token.loc.end.line,
        endColumn: token.loc.end.column,
        message: '+1',
    };
}
function computeCyclomaticComplexity(node, parent, context) {
    const visitor = new FunctionComplexityVisitor(node, parent, context);
    visitor.visit();
    return visitor.getComplexityTokens();
}
class FunctionComplexityVisitor {
    constructor(root, parent, context) {
        this.root = root;
        this.parent = parent;
        this.context = context;
        this.tokens = [];
    }
    visit() {
        const visitNode = (node) => {
            const { sourceCode } = this.context;
            let token;
            if ((0, helpers_1.isFunctionNode)(node)) {
                if (node !== this.root) {
                    return;
                }
                else {
                    token = {
                        loc: (0, helpers_1.getMainFunctionTokenLocation)(node, this.parent, this.context),
                    };
                }
            }
            else {
                switch (node.type) {
                    case 'ConditionalExpression':
                        token = sourceCode.getFirstTokenBetween(node.test, node.consequent, token => token.value === '?');
                        break;
                    case 'SwitchCase':
                        // ignore default case
                        if (!node.test) {
                            break;
                        }
                    case 'IfStatement':
                    case 'ForStatement':
                    case 'ForInStatement':
                    case 'ForOfStatement':
                    case 'WhileStatement':
                    case 'DoWhileStatement':
                        token = sourceCode.getFirstToken(node);
                        break;
                    case 'LogicalExpression':
                        token = sourceCode.getTokenAfter(node.left, token => ['||', '&&'].includes(token.value) && token.type === 'Punctuator');
                        break;
                }
            }
            if (token) {
                this.tokens.push(token);
            }
            (0, helpers_1.childrenOf)(node, sourceCode.visitorKeys).forEach(visitNode);
        };
        visitNode(this.root);
    }
    getComplexityTokens() {
        return this.tokens;
    }
}
//# sourceMappingURL=rule.js.map