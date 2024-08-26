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
// https://sonarsource.github.io/rspec/#/rspec/S134/javascript
Object.defineProperty(exports, "__esModule", { value: true });
exports.rule = void 0;
const helpers_1 = require("../helpers");
const meta_1 = require("./meta");
const DEFAULT_MAXIMUM_NESTING_LEVEL = 3;
exports.rule = {
    meta: (0, helpers_1.generateMeta)(meta_1.meta, { schema: meta_1.schema }, true),
    create(context) {
        const sourceCode = context.sourceCode;
        const threshold = context.options[0]?.maximumNestingLevel ??
            DEFAULT_MAXIMUM_NESTING_LEVEL;
        const nodeStack = [];
        function push(n) {
            nodeStack.push(n);
        }
        function pop() {
            return nodeStack.pop();
        }
        function check(node) {
            if (nodeStack.length === threshold) {
                (0, helpers_1.report)(context, {
                    message: `Refactor this code to not nest more than ${threshold} if/for/while/switch/try statements.`,
                    loc: sourceCode.getFirstToken(node).loc,
                }, nodeStack.map(n => (0, helpers_1.toSecondaryLocation)(n, '+1')));
            }
        }
        function isElseIf(node) {
            const parent = (0, helpers_1.last)(context.sourceCode.getAncestors(node));
            return (node.type === 'IfStatement' && parent.type === 'IfStatement' && node === parent.alternate);
        }
        const controlFlowNodes = [
            'ForStatement',
            'ForInStatement',
            'ForOfStatement',
            'WhileStatement',
            'DoWhileStatement',
            'IfStatement',
            'TryStatement',
            'SwitchStatement',
        ].join(',');
        return {
            [controlFlowNodes]: (node) => {
                if (isElseIf(node)) {
                    pop();
                    push(sourceCode.getFirstToken(node));
                }
                else {
                    check(node);
                    push(sourceCode.getFirstToken(node));
                }
            },
            [`${controlFlowNodes}:exit`]: (node) => {
                if (!isElseIf(node)) {
                    pop();
                }
            },
        };
    },
};
//# sourceMappingURL=rule.js.map