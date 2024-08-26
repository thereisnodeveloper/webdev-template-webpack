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
// https://sonarsource.github.io/rspec/#/rspec/S4323/javascript
Object.defineProperty(exports, "__esModule", { value: true });
exports.rule = void 0;
const helpers_1 = require("../helpers");
const meta_1 = require("./meta");
const TYPE_THRESHOLD = 2;
const USAGE_THRESHOLD = 2;
exports.rule = {
    meta: (0, helpers_1.generateMeta)(meta_1.meta, undefined, true),
    create(context) {
        let usage;
        return {
            Program: () => (usage = new Map()),
            'Program:exit': () => usage.forEach(nodes => {
                if (nodes.length > USAGE_THRESHOLD) {
                    const [node, ...rest] = nodes;
                    const kind = node.type === 'TSUnionType' ? 'union' : 'intersection';
                    const message = `Replace this ${kind} type with a type alias.`;
                    (0, helpers_1.report)(context, { message, loc: node.loc }, rest.map(node => (0, helpers_1.toSecondaryLocation)(node, 'Following occurrence.')));
                }
            }),
            'TSUnionType, TSIntersectionType': (node) => {
                const ancestors = context.sourceCode.getAncestors(node);
                const declaration = ancestors.find(ancestor => ancestor.type === 'TSTypeAliasDeclaration');
                if (declaration) {
                    return;
                }
                const composite = node;
                if (composite.types.length <= TYPE_THRESHOLD) {
                    return;
                }
                if (isNullableType(composite)) {
                    return;
                }
                const text = composite.types
                    .map(typeNode => context.sourceCode.getText(typeNode))
                    .sort((a, b) => a.localeCompare(b))
                    .join('|');
                let occurrences = usage.get(text);
                if (!occurrences) {
                    occurrences = [composite];
                    usage.set(text, occurrences);
                }
                else {
                    occurrences.push(composite);
                }
            },
        };
        function isNullableType(node) {
            return (node.type === 'TSUnionType' &&
                node.types.filter(type => type.type !== 'TSNullKeyword' && type.type !== 'TSUndefinedKeyword').length === 1);
        }
    },
};
//# sourceMappingURL=rule.js.map