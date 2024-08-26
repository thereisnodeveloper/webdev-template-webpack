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
// https://sonarsource.github.io/rspec/#/rspec/S1192
Object.defineProperty(exports, "__esModule", { value: true });
exports.rule = void 0;
const utils_1 = require("@typescript-eslint/utils");
const helpers_1 = require("../helpers");
const meta_1 = require("./meta");
// Number of times a literal must be duplicated to trigger an issue
const MIN_LENGTH = 10;
const NO_SEPARATOR_REGEXP = /^\w*$/;
const EXCLUDED_CONTEXTS = [
    'ImportDeclaration',
    'ImportExpression',
    'JSXAttribute',
    'ExportAllDeclaration',
    'ExportNamedDeclaration',
];
const message = 'Define a constant instead of duplicating this literal {{times}} times.';
const DEFAULT_OPTIONS = {
    threshold: 3,
    ignoreStrings: 'application/json',
};
const messages = {
    defineConstant: message,
};
exports.rule = {
    meta: (0, helpers_1.generateMeta)(meta_1.meta, { messages, schema: meta_1.schema }, true),
    create(context) {
        const literalsByValue = new Map();
        const { threshold, ignoreStrings } = {
            ...DEFAULT_OPTIONS,
            ...context.options[0],
        };
        const whitelist = ignoreStrings.split(',');
        return {
            Literal: (node) => {
                const literal = node;
                const { parent } = literal;
                if (typeof literal.value === 'string' &&
                    parent &&
                    !['ExpressionStatement', 'TSLiteralType'].includes(parent.type)) {
                    const stringContent = literal.value.trim();
                    if (!whitelist.includes(literal.value) &&
                        !isExcludedByUsageContext(context, literal) &&
                        stringContent.length >= MIN_LENGTH &&
                        !NO_SEPARATOR_REGEXP.exec(stringContent)) {
                        const sameStringLiterals = literalsByValue.get(stringContent) || [];
                        sameStringLiterals.push(literal);
                        literalsByValue.set(stringContent, sameStringLiterals);
                    }
                }
            },
            'Program:exit'() {
                literalsByValue.forEach(literals => {
                    if (literals.length >= threshold) {
                        const [primaryNode, ...secondaryNodes] = literals;
                        const secondaryIssues = secondaryNodes.map(node => (0, helpers_1.toSecondaryLocation)(node, 'Duplication'));
                        (0, helpers_1.report)(context, {
                            message,
                            node: primaryNode,
                            data: { times: literals.length.toString() },
                        }, secondaryIssues);
                    }
                });
            },
        };
    },
};
function isExcludedByUsageContext(context, literal) {
    const { parent } = literal;
    const parentType = parent.type;
    return (EXCLUDED_CONTEXTS.includes(parentType) ||
        isRequireContext(parent, context) ||
        isObjectPropertyKey(parent, literal));
}
function isRequireContext(parent, context) {
    return (parent.type === 'CallExpression' && context.sourceCode.getText(parent.callee) === 'require');
}
function isObjectPropertyKey(parent, literal) {
    return parent.type === utils_1.AST_NODE_TYPES.Property && parent.key === literal;
}
//# sourceMappingURL=rule.js.map