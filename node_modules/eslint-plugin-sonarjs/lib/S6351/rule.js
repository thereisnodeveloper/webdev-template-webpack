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
// https://sonarsource.github.io/rspec/#/rspec/S6351/javascript
Object.defineProperty(exports, "__esModule", { value: true });
exports.rule = void 0;
const helpers_1 = require("../helpers");
const regex_1 = require("../helpers/regex");
const meta_1 = require("./meta");
exports.rule = {
    meta: (0, helpers_1.generateMeta)(meta_1.meta, undefined, true),
    create(context) {
        const invocations = new Map();
        const regexes = [];
        const resets = new Set();
        return {
            'Literal:exit': (node) => {
                extractRegex(node, regexes);
            },
            'CallExpression:exit': (node) => {
                const callExpr = node;
                extractRegex(node, regexes);
                extractRegexInvocation(callExpr, regexes, invocations, context);
                checkWhileConditionRegex(callExpr, context);
            },
            'MemberExpression:exit': (node) => {
                extractResetRegex(node, regexes, resets, context);
            },
            'NewExpression:exit': (node) => {
                extractRegex(node, regexes);
            },
            'Program:exit': () => {
                regexes.forEach(regex => checkGlobalStickyRegex(regex, context));
                invocations.forEach((usages, regex) => checkMultipleInputsRegex(regex, usages, resets, context));
            },
        };
    },
};
function extractRegex(node, acc) {
    if ((0, helpers_1.isRegexLiteral)(node)) {
        const { flags } = node.regex;
        acc.push({ node, flags });
    }
    else if ((0, regex_1.isRegExpConstructor)(node)) {
        const flags = (0, regex_1.getFlags)(node) ?? '';
        acc.push({ node, flags });
    }
}
function extractRegexInvocation(callExpr, regexes, invocations, context) {
    if ((0, helpers_1.isCallingMethod)(callExpr, 1, 'exec', 'test') &&
        callExpr.callee.object.type === 'Identifier') {
        const { object } = callExpr.callee;
        const variable = (0, helpers_1.getVariableFromName)(context, object.name, callExpr);
        if (variable) {
            const value = (0, helpers_1.getUniqueWriteUsage)(context, variable.name, callExpr);
            const regex = regexes.find(r => r.node === value);
            if (regex?.flags.includes('g')) {
                const usages = invocations.get(variable);
                if (usages) {
                    usages.push(callExpr);
                }
                else {
                    invocations.set(variable, [callExpr]);
                }
            }
        }
    }
}
function extractResetRegex(node, regexes, resets, context) {
    /* RegExp.prototype.lastIndex = ... */
    if ((0, helpers_1.isDotNotation)(node) &&
        node.object.type === 'Identifier' &&
        node.property.name === 'lastIndex') {
        const parent = (0, helpers_1.getParent)(context, node);
        if (parent?.type === 'AssignmentExpression' && parent.left === node) {
            const variable = (0, helpers_1.getVariableFromName)(context, node.object.name, node);
            if (variable) {
                const value = (0, helpers_1.getUniqueWriteUsage)(context, variable.name, node);
                const regex = regexes.find(r => r.node === value);
                if (regex) {
                    resets.add(variable);
                }
            }
        }
    }
}
function checkWhileConditionRegex(callExpr, context) {
    /* RegExp.prototype.exec() within while conditions */
    if ((0, helpers_1.isMethodCall)(callExpr)) {
        const { object, property } = callExpr.callee;
        if (((0, helpers_1.isRegexLiteral)(object) || (0, regex_1.isRegExpConstructor)(object)) && property.name === 'exec') {
            const flags = object.type === 'Literal' ? object.regex.flags : (0, regex_1.getFlags)(object);
            if (flags?.includes('g') && isWithinWhileCondition(callExpr, context)) {
                (0, helpers_1.report)(context, {
                    message: 'Extract this regular expression to avoid infinite loop.',
                    node: object,
                });
            }
        }
    }
}
function checkGlobalStickyRegex(regex, context) {
    /* RegExp with `g` and `y` flags */
    if (regex.flags.includes('g') && regex.flags.includes('y')) {
        (0, helpers_1.report)(context, {
            message: `Remove the 'g' flag from this regex as it is shadowed by the 'y' flag.`,
            node: regex.node,
        });
    }
}
function checkMultipleInputsRegex(regex, usages, resets, context) {
    /* RegExp.prototype.exec(input) / RegExp.prototype.test(input) */
    if (!resets.has(regex)) {
        const definition = regex.defs.find(def => def.type === 'Variable' && def.node.init);
        const uniqueInputs = new Set(usages.map(callExpr => context.sourceCode.getText(callExpr.arguments[0])));
        const regexReset = uniqueInputs.has(`''`) || uniqueInputs.has(`""`);
        if (definition && uniqueInputs.size > 1 && !regexReset) {
            const pattern = definition.node.init;
            (0, helpers_1.report)(context, {
                message: `Remove the 'g' flag from this regex as it is used on different inputs.`,
                node: pattern,
            }, usages.map((node, idx) => (0, helpers_1.toSecondaryLocation)(node, `Usage ${idx + 1}`)));
        }
    }
}
function isWithinWhileCondition(node, context) {
    const ancestors = context.sourceCode.getAncestors(node);
    let parent;
    let child = node;
    while ((parent = ancestors.pop()) !== undefined) {
        if (helpers_1.functionLike.has(parent.type)) {
            break;
        }
        if (parent.type === 'WhileStatement' || parent.type === 'DoWhileStatement') {
            return parent.test === child;
        }
        child = parent;
    }
    return false;
}
//# sourceMappingURL=rule.js.map