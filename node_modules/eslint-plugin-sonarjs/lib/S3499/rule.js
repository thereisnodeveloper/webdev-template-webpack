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
// https://sonarsource.github.io/rspec/#/rspec/S3499/javascript
Object.defineProperty(exports, "__esModule", { value: true });
exports.rule = void 0;
const helpers_1 = require("../helpers");
const meta_1 = require("./meta");
exports.rule = {
    meta: (0, helpers_1.generateMeta)(meta_1.meta, undefined, true),
    create(context) {
        function raiseIssue(node, begin, end, positionMessage) {
            const properties = node.properties;
            const secondaryLocations = [];
            for (let i = begin; i < end; i++) {
                const prop = properties[i];
                if (prop.shorthand) {
                    secondaryLocations.push((0, helpers_1.toSecondaryLocation)(prop, `Move to ${positionMessage}`));
                }
            }
            (0, helpers_1.report)(context, {
                message: `Group all shorthand properties at ${positionMessage} of this object declaration.`,
                loc: context.sourceCode.getFirstToken(node).loc,
            }, secondaryLocations);
        }
        return {
            ObjectExpression(node) {
                const objectExpression = node;
                const objectExpressionProperties = objectExpression.properties;
                if (objectExpressionProperties.some(p => p.type !== 'Property')) {
                    return;
                }
                const isShorthandPropertyList = objectExpressionProperties.map(p => p.shorthand);
                const shorthandPropertiesNumber = isShorthandPropertyList.filter(b => b).length;
                const numberOfShorthandAtBeginning = getNumberOfTrueAtBeginning(isShorthandPropertyList);
                const numberOfShorthandAtEnd = getNumberOfTrueAtBeginning([...isShorthandPropertyList].reverse());
                const allAtBeginning = numberOfShorthandAtBeginning === shorthandPropertiesNumber;
                const allAtEnd = numberOfShorthandAtEnd === shorthandPropertiesNumber;
                const propertiesNumber = isShorthandPropertyList.length;
                if (!allAtBeginning && numberOfShorthandAtBeginning > numberOfShorthandAtEnd) {
                    raiseIssue(objectExpression, numberOfShorthandAtBeginning, propertiesNumber, 'the beginning');
                }
                else if (!allAtEnd && numberOfShorthandAtEnd > numberOfShorthandAtBeginning) {
                    raiseIssue(objectExpression, 0, propertiesNumber - numberOfShorthandAtEnd, 'the end');
                }
                else if (!allAtBeginning && !allAtEnd) {
                    raiseIssue(objectExpression, 0, propertiesNumber, 'either the beginning or end');
                }
            },
        };
    },
};
function getNumberOfTrueAtBeginning(list) {
    let numberOfTrueAtBeginning = 0;
    for (const b of list) {
        if (b) {
            numberOfTrueAtBeginning++;
        }
        else {
            break;
        }
    }
    return numberOfTrueAtBeginning;
}
//# sourceMappingURL=rule.js.map