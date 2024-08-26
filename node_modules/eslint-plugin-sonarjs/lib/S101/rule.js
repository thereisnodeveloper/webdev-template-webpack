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
// https://sonarsource.github.io/rspec/#/rspec/S101/javascript
Object.defineProperty(exports, "__esModule", { value: true });
exports.rule = void 0;
const helpers_1 = require("../helpers");
const meta_1 = require("./meta");
const DEFAULT_FORMAT = '^[A-Z][a-zA-Z0-9]*$';
const messages = {
    renameClass: 'Rename {{symbolType}} "{{symbol}}" to match the regular expression {{format}}.',
};
exports.rule = {
    meta: (0, helpers_1.generateMeta)(meta_1.meta, { messages, schema: meta_1.schema }),
    create(context) {
        return {
            ClassDeclaration: (node) => checkName(node, 'class', context),
            TSInterfaceDeclaration: (node) => checkName(node, 'interface', context),
        };
    },
};
function checkName(node, declarationType, context) {
    const format = context.options[0]?.format ?? DEFAULT_FORMAT;
    if (node.id) {
        const name = node.id.name;
        if (!name.match(format)) {
            context.report({
                messageId: 'renameClass',
                data: {
                    symbol: name,
                    symbolType: declarationType,
                    format,
                },
                node: node.id,
            });
        }
    }
}
//# sourceMappingURL=rule.js.map