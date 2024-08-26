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
// https://sonarsource.github.io/rspec/#/rspec/S1751
Object.defineProperty(exports, "__esModule", { value: true });
exports.rule = void 0;
const utils_1 = require("@typescript-eslint/utils");
const helpers_1 = require("../helpers");
const meta_1 = require("./meta");
exports.rule = {
    meta: (0, helpers_1.generateMeta)(meta_1.meta, {
        messages: {
            refactorLoop: 'Refactor this loop to do more than one iteration.',
        },
    }),
    // @ts-ignore The typings of @typescript-eslint/utils does not contain the 'onX' methods.
    create(context) {
        const loopingNodes = new Set();
        const loops = new Set();
        const loopsAndTheirSegments = [];
        const codePathSegments = [];
        let currentCodePathSegments = [];
        return {
            ForStatement(node) {
                loops.add(node);
            },
            WhileStatement(node) {
                loops.add(node);
            },
            DoWhileStatement(node) {
                loops.add(node);
            },
            onCodePathStart() {
                codePathSegments.push(currentCodePathSegments);
                currentCodePathSegments = [];
            },
            onCodePathSegmentStart(segment) {
                currentCodePathSegments.push(segment);
            },
            onCodePathSegmentEnd() {
                currentCodePathSegments.pop();
            },
            onCodePathEnd() {
                currentCodePathSegments = codePathSegments.pop();
            },
            'WhileStatement > *'(node) {
                visitLoopChild(node.parent);
            },
            'ForStatement > *'(node) {
                visitLoopChild(node.parent);
            },
            onCodePathSegmentLoop(_, toSegment, node) {
                if (node.type === utils_1.AST_NODE_TYPES.ContinueStatement) {
                    loopsAndTheirSegments.forEach(({ segments, loop }) => {
                        if (segments.includes(toSegment)) {
                            loopingNodes.add(loop);
                        }
                    });
                }
                else {
                    loopingNodes.add(node);
                }
            },
            'Program:exit'() {
                loops.forEach(loop => {
                    if (!loopingNodes.has(loop)) {
                        context.report({
                            messageId: 'refactorLoop',
                            loc: context.sourceCode.getFirstToken(loop).loc,
                        });
                    }
                });
            },
        };
        // Required to correctly process "continue" looping.
        // When a loop has a "continue" statement, this "continue" statement triggers a "onCodePathSegmentLoop" event,
        // and the corresponding event node is that "continue" statement. Current implementation is based on the fact
        // that the "onCodePathSegmentLoop" event is triggered with a loop node. To work this special case around,
        // we visit loop children and collect corresponding path segments as these segments are "toSegment"
        // in "onCodePathSegmentLoop" event.
        function visitLoopChild(parent) {
            if (currentCodePathSegments.length > 0) {
                loopsAndTheirSegments.push({ segments: [...currentCodePathSegments], loop: parent });
            }
        }
    },
};
//# sourceMappingURL=rule.js.map