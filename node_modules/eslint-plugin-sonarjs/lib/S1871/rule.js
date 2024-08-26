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
// https://sonarsource.github.io/rspec/#/rspec/S1871
Object.defineProperty(exports, "__esModule", { value: true });
exports.rule = void 0;
const utils_1 = require("@typescript-eslint/utils");
const helpers_1 = require("../helpers");
const meta_1 = require("./meta");
const message = "This {{type}}'s code block is the same as the block for the {{type}} on line {{line}}.";
exports.rule = {
    meta: (0, helpers_1.generateMeta)(meta_1.meta, {
        messages: {
            sameConditionalBlock: message,
        },
    }, true),
    create(context) {
        return {
            IfStatement(node) {
                visitIfStatement(node);
            },
            SwitchStatement(node) {
                visitSwitchStatement(node);
            },
        };
        function visitIfStatement(ifStmt) {
            if ((0, helpers_1.isIfStatement)(ifStmt.parent)) {
                return;
            }
            const { branches, endsWithElse } = (0, helpers_1.collectIfBranches)(ifStmt);
            if (allEquivalentWithoutDefault(branches, endsWithElse)) {
                branches.slice(1).forEach((branch, i) => reportIssue(branch, branches[i], 'branch'));
                return;
            }
            for (let i = 1; i < branches.length; i++) {
                if (hasRequiredSize([branches[i]])) {
                    for (let j = 0; j < i; j++) {
                        if (compareIfBranches(branches[i], branches[j])) {
                            break;
                        }
                    }
                }
            }
        }
        function visitSwitchStatement(switchStmt) {
            const { cases } = switchStmt;
            const { endsWithDefault } = (0, helpers_1.collectSwitchBranches)(switchStmt);
            const nonEmptyCases = cases.filter(c => (0, helpers_1.takeWithoutBreak)(expandSingleBlockStatement(c.consequent)).length > 0);
            const casesWithoutBreak = nonEmptyCases.map(c => (0, helpers_1.takeWithoutBreak)(expandSingleBlockStatement(c.consequent)));
            if (allEquivalentWithoutDefault(casesWithoutBreak, endsWithDefault)) {
                nonEmptyCases
                    .slice(1)
                    .forEach((caseStmt, i) => reportIssue(caseStmt, nonEmptyCases[i], 'case'));
                return;
            }
            for (let i = 1; i < cases.length; i++) {
                const firstClauseWithoutBreak = (0, helpers_1.takeWithoutBreak)(expandSingleBlockStatement(cases[i].consequent));
                if (hasRequiredSize(firstClauseWithoutBreak)) {
                    for (let j = 0; j < i; j++) {
                        const secondClauseWithoutBreak = (0, helpers_1.takeWithoutBreak)(expandSingleBlockStatement(cases[j].consequent));
                        if ((0, helpers_1.areEquivalent)(firstClauseWithoutBreak, secondClauseWithoutBreak, context.sourceCode)) {
                            reportIssue(cases[i], cases[j], 'case');
                            break;
                        }
                    }
                }
            }
        }
        function hasRequiredSize(nodes) {
            if (nodes.length > 0) {
                const tokens = [
                    ...context.sourceCode.getTokens(nodes[0]),
                    ...context.sourceCode.getTokens(nodes[nodes.length - 1]),
                ].filter(token => token.value !== '{' && token.value !== '}');
                return (tokens.length > 0 && tokens[tokens.length - 1].loc.end.line > tokens[0].loc.start.line);
            }
            return false;
        }
        function compareIfBranches(a, b) {
            const equivalent = (0, helpers_1.areEquivalent)(a, b, context.sourceCode);
            if (equivalent && b.loc) {
                reportIssue(a, b, 'branch');
            }
            return equivalent;
        }
        function expandSingleBlockStatement(nodes) {
            if (nodes.length === 1) {
                const node = nodes[0];
                if (node.type === utils_1.AST_NODE_TYPES.BlockStatement) {
                    return node.body;
                }
            }
            return nodes;
        }
        function allEquivalentWithoutDefault(branches, endsWithDefault) {
            return (!endsWithDefault &&
                branches.length > 1 &&
                branches
                    .slice(1)
                    .every((branch, index) => (0, helpers_1.areEquivalent)(branch, branches[index], context.sourceCode)));
        }
        function reportIssue(node, equivalentNode, type) {
            const equivalentNodeLoc = equivalentNode.loc;
            (0, helpers_1.report)(context, {
                message,
                messageId: 'sameConditionalBlock',
                data: { type, line: String(equivalentNodeLoc.start.line) },
                node,
            }, [(0, helpers_1.toSecondaryLocation)(equivalentNode, 'Original')]);
        }
    },
};
//# sourceMappingURL=rule.js.map