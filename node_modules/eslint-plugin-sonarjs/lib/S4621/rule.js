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
// https://sonarsource.github.io/rspec/#/rspec/S4621/javascript
Object.defineProperty(exports, "__esModule", { value: true });
exports.rule = void 0;
const helpers_1 = require("../helpers");
const meta_1 = require("./meta");
exports.rule = {
    meta: (0, helpers_1.generateMeta)(meta_1.meta, { hasSuggestions: true }, true),
    create(context) {
        return {
            'TSUnionType, TSIntersectionType'(node) {
                const sourceCode = context.sourceCode;
                const compositeType = node;
                const groupedTypes = new Map();
                compositeType.types.forEach(typescriptType => {
                    const nodeValue = sourceCode.getText(typescriptType);
                    const nodesWithGivenType = groupedTypes.get(nodeValue);
                    const nodeType = typescriptType;
                    if (!nodesWithGivenType) {
                        groupedTypes.set(nodeValue, [nodeType]);
                    }
                    else {
                        nodesWithGivenType.push(nodeType);
                    }
                });
                groupedTypes.forEach(duplicates => {
                    if (duplicates.length > 1) {
                        const suggest = getSuggestions(compositeType, duplicates, context);
                        const primaryNode = duplicates.splice(1, 1)[0];
                        const secondaryLocations = duplicates.map((node, index) => (0, helpers_1.toSecondaryLocation)(node, index ? 'Another duplicate' : 'Original'));
                        (0, helpers_1.report)(context, {
                            message: `Remove this duplicated type or replace with another one.`,
                            loc: primaryNode.loc,
                            suggest,
                        }, secondaryLocations);
                    }
                });
            },
        };
    },
};
function getSuggestions(composite, duplicates, context) {
    const ranges = duplicates.slice(1).map(duplicate => {
        const idx = composite.types.indexOf(duplicate);
        return [
            getEnd(context, composite.types[idx - 1], composite),
            getEnd(context, duplicate, composite),
        ];
    });
    return [
        {
            desc: 'Remove duplicate types',
            fix: fixer => ranges.map(r => fixer.removeRange(r)),
        },
    ];
}
function getEnd(context, node, composite) {
    let end = node;
    while (true) {
        const nextToken = context.sourceCode.getTokenAfter(end);
        if (nextToken && nextToken.value === ')' && nextToken.range[1] <= composite.range[1]) {
            end = nextToken;
        }
        else {
            break;
        }
    }
    return end.range[1];
}
//# sourceMappingURL=rule.js.map