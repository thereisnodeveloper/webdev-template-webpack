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
// https://sonarsource.github.io/rspec/#/rspec/S2428
Object.defineProperty(exports, "__esModule", { value: true });
exports.rule = void 0;
const utils_1 = require("@typescript-eslint/utils");
const helpers_1 = require("../helpers");
const meta_1 = require("./meta");
exports.rule = {
    meta: (0, helpers_1.generateMeta)(meta_1.meta, {
        messages: {
            declarePropertiesInsideObject: 'Declare one or more properties of this object inside of the object literal syntax instead of using separate statements.',
        },
    }),
    create(context) {
        return {
            BlockStatement: (node) => checkObjectInitialization(node.body, context),
            Program: (node) => {
                checkObjectInitialization((0, helpers_1.getProgramStatements)(node), context);
            },
        };
    },
};
function checkObjectInitialization(statements, context) {
    let index = 0;
    while (index < statements.length - 1) {
        const objectDeclaration = getObjectDeclaration(statements[index]);
        if (objectDeclaration && (0, helpers_1.isIdentifier)(objectDeclaration.id)) {
            const nextStmt = statements[index + 1];
            if (isPropertyAssignment(nextStmt, objectDeclaration.id, context.sourceCode)) {
                context.report({ messageId: 'declarePropertiesInsideObject', node: objectDeclaration });
            }
        }
        index++;
    }
}
function getObjectDeclaration(statement) {
    if (statement.type === utils_1.AST_NODE_TYPES.VariableDeclaration) {
        return statement.declarations.find(declaration => !!declaration.init && isEmptyObjectExpression(declaration.init));
    }
    return undefined;
}
function isEmptyObjectExpression(expression) {
    return expression.type === utils_1.AST_NODE_TYPES.ObjectExpression && expression.properties.length === 0;
}
function isPropertyAssignment(statement, objectIdentifier, sourceCode) {
    if (statement.type === utils_1.AST_NODE_TYPES.ExpressionStatement &&
        statement.expression.type === utils_1.AST_NODE_TYPES.AssignmentExpression) {
        const { left, right } = statement.expression;
        if (left.type === utils_1.AST_NODE_TYPES.MemberExpression) {
            return (!left.computed &&
                isSingleLineExpression(right, sourceCode) &&
                (0, helpers_1.areEquivalent)(left.object, objectIdentifier, sourceCode) &&
                !(0, helpers_1.areEquivalent)(left.object, right, sourceCode));
        }
    }
    return false;
    function isSingleLineExpression(expression, sourceCode) {
        const first = sourceCode.getFirstToken(expression).loc;
        const last = sourceCode.getLastToken(expression).loc;
        return first.start.line === last.end.line;
    }
}
//# sourceMappingURL=rule.js.map