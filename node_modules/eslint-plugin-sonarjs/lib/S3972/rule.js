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
// https://sonarsource.github.io/rspec/#/rspec/S3972
Object.defineProperty(exports, "__esModule", { value: true });
exports.rule = void 0;
const helpers_1 = require("../helpers");
const meta_1 = require("./meta");
const message = 'Move this "if" to a new line or add the missing "else".';
exports.rule = {
    meta: (0, helpers_1.generateMeta)(meta_1.meta, {
        hasSuggestions: true,
        messages: {
            sameLineCondition: message,
            suggestAddingElse: 'Add "else" keyword',
            suggestAddingNewline: 'Move this "if" to a new line',
        },
    }, true),
    create(context) {
        function checkStatements(statements) {
            const { sourceCode } = context;
            const siblingIfStatements = getSiblingIfStatements(statements);
            siblingIfStatements.forEach(siblingIfStatement => {
                const precedingIf = siblingIfStatement.first;
                const followingIf = siblingIfStatement.following;
                if (!!precedingIf.loc &&
                    !!followingIf.loc &&
                    precedingIf.loc.end.line === followingIf.loc.start.line &&
                    precedingIf.loc.start.line !== followingIf.loc.end.line) {
                    const precedingIfLastToken = sourceCode.getLastToken(precedingIf);
                    const followingIfToken = sourceCode.getFirstToken(followingIf);
                    (0, helpers_1.report)(context, {
                        messageId: 'sameLineCondition',
                        message,
                        loc: followingIfToken.loc,
                        suggest: [
                            {
                                messageId: 'suggestAddingElse',
                                fix: fixer => fixer.insertTextBefore(followingIfToken, 'else '),
                            },
                            {
                                messageId: 'suggestAddingNewline',
                                fix: fixer => fixer.replaceTextRange([precedingIf.range[1], followingIf.range[0]], '\n' + ' '.repeat(precedingIf.loc.start.column)),
                            },
                        ],
                    }, [(0, helpers_1.toSecondaryLocation)(precedingIfLastToken)]);
                }
            });
        }
        return {
            Program: (node) => checkStatements(node.body),
            BlockStatement: (node) => checkStatements(node.body),
            SwitchCase: (node) => checkStatements(node.consequent),
        };
    },
};
function getSiblingIfStatements(statements) {
    return statements.reduce((siblingsArray, statement, currentIndex) => {
        const previousStatement = statements[currentIndex - 1];
        if (statement.type === 'IfStatement' &&
            !!previousStatement &&
            previousStatement.type === 'IfStatement') {
            return [{ first: previousStatement, following: statement }, ...siblingsArray];
        }
        return siblingsArray;
    }, []);
}
//# sourceMappingURL=rule.js.map