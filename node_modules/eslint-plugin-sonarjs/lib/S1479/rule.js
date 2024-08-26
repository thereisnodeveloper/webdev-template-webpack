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
// https://sonarsource.github.io/rspec/#/rspec/S1479
Object.defineProperty(exports, "__esModule", { value: true });
exports.rule = void 0;
const helpers_1 = require("../helpers");
const meta_1 = require("./meta");
const DEFAULT_MAX_SWITCH_CASES = 30;
exports.rule = {
    meta: (0, helpers_1.generateMeta)(meta_1.meta, {
        messages: {
            reduceNumberOfNonEmptySwitchCases: 'Reduce the number of non-empty switch cases from {{numSwitchCases}} to at most {{maxSwitchCases}}.',
        },
        schema: meta_1.schema,
    }),
    create(context) {
        const maxSwitchCases = context.options[0] ?? DEFAULT_MAX_SWITCH_CASES;
        return {
            SwitchStatement: (node) => visitSwitchStatement(node, context, maxSwitchCases),
        };
    },
};
function visitSwitchStatement(switchStatement, context, maxSwitchCases) {
    const nonEmptyCases = switchStatement.cases.filter(switchCase => switchCase.consequent.length > 0 && !isDefaultCase(switchCase));
    if (nonEmptyCases.length > maxSwitchCases) {
        const switchKeyword = context.sourceCode.getFirstToken(switchStatement);
        context.report({
            messageId: 'reduceNumberOfNonEmptySwitchCases',
            loc: switchKeyword.loc,
            data: {
                numSwitchCases: nonEmptyCases.length.toString(),
                maxSwitchCases: maxSwitchCases.toString(),
            },
        });
    }
}
function isDefaultCase(switchCase) {
    return switchCase.test === null;
}
//# sourceMappingURL=rule.js.map