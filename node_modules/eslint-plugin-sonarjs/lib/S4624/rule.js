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
// https://sonarsource.github.io/rspec/#/rspec/S4624
Object.defineProperty(exports, "__esModule", { value: true });
exports.rule = void 0;
const helpers_1 = require("../helpers");
const meta_1 = require("./meta");
exports.rule = {
    meta: (0, helpers_1.generateMeta)(meta_1.meta, {
        messages: {
            nestedTemplateLiterals: 'Refactor this code to not use nested template literals.',
        },
    }),
    create(context) {
        return {
            'TemplateLiteral TemplateLiteral': (node) => {
                const ancestors = (0, helpers_1.ancestorsChain)(node, new Set(['TemplateLiteral']));
                const nestingTemplate = ancestors[ancestors.length - 1];
                const { start: nestingStart, end: nestingEnd } = nestingTemplate.loc;
                const { start: nestedStart, end: nestedEnd } = node.loc;
                if (nestedStart.line === nestingStart.line || nestedEnd.line === nestingEnd.line) {
                    context.report({
                        messageId: 'nestedTemplateLiterals',
                        node,
                    });
                }
            },
        };
    },
};
//# sourceMappingURL=rule.js.map