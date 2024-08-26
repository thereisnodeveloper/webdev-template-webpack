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
// https://sonarsource.github.io/rspec/#/rspec/S1526/javascript
Object.defineProperty(exports, "__esModule", { value: true });
exports.rule = void 0;
const helpers_1 = require("../helpers");
const meta_1 = require("./meta");
exports.rule = {
    meta: (0, helpers_1.generateMeta)(meta_1.meta, undefined, true),
    create(context) {
        return {
            "VariableDeclaration[kind='var']": (node) => {
                const variables = context.sourceCode.getDeclaredVariables(node);
                for (const variable of variables) {
                    const declaration = variable.identifiers[0];
                    const misused = variable.references
                        .filter(reference => !reference.init && comesBefore(reference.identifier, declaration))
                        .map(reference => reference.identifier);
                    if (misused.length > 0) {
                        (0, helpers_1.report)(context, {
                            message: `Move the declaration of "${declaration.name}" before this usage.`,
                            node: misused[0],
                        }, [(0, helpers_1.toSecondaryLocation)(declaration, 'Declaration')]);
                    }
                }
            },
        };
    },
};
function comesBefore(node, other) {
    const nodeLine = line(node), otherLine = line(other);
    return nodeLine < otherLine || (nodeLine === otherLine && column(node) < column(other));
}
function line(node) {
    return node.loc.start.line;
}
function column(node) {
    return node.loc.start.column;
}
//# sourceMappingURL=rule.js.map