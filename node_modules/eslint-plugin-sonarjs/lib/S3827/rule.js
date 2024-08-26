"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rule = void 0;
const helpers_1 = require("../helpers");
const meta_1 = require("./meta");
// https://vuejs.org/api/sfc-script-setup.html#defineprops-defineemits
const vueMacroNames = new Set([
    'defineProps',
    'defineEmits',
    'defineExpose',
    'defineOptions',
    'defineSlots',
    'withDefaults',
]);
exports.rule = {
    meta: (0, helpers_1.generateMeta)(meta_1.meta, undefined, true),
    create(context) {
        const excludedNames = new Set();
        const undeclaredIdentifiersByName = new Map();
        return {
            'Program:exit'(node) {
                excludedNames.clear();
                undeclaredIdentifiersByName.clear();
                const globalScope = context.sourceCode.getScope(node);
                globalScope.through.forEach(ref => {
                    const identifier = ref.identifier;
                    if (excludedNames.has(identifier.name)) {
                        return;
                    }
                    if (ref.writeExpr ||
                        hasTypeOfOperator(identifier) ||
                        isWithinWithStatement(identifier)) {
                        excludedNames.add(identifier.name);
                        return;
                    }
                    if (vueMacroNames.has(identifier.name) && (0, helpers_1.isInsideVueSetupScript)(identifier, context)) {
                        return;
                    }
                    const undeclaredIndentifiers = undeclaredIdentifiersByName.get(identifier.name);
                    if (undeclaredIndentifiers) {
                        undeclaredIndentifiers.push(identifier);
                    }
                    else {
                        undeclaredIdentifiersByName.set(identifier.name, [identifier]);
                    }
                });
                undeclaredIdentifiersByName.forEach((identifiers, name) => {
                    (0, helpers_1.report)(context, {
                        node: identifiers[0],
                        message: `"${name}" does not exist. Change its name or declare it so that its usage doesn't result in a "ReferenceError".`,
                    }, identifiers.slice(1).map(node => (0, helpers_1.toSecondaryLocation)(node)));
                });
            },
        };
    },
};
function isWithinWithStatement(node) {
    return !!(0, helpers_1.findFirstMatchingAncestor)(node, ancestor => ancestor.type === 'WithStatement');
}
function hasTypeOfOperator(node) {
    const parent = node.parent;
    return parent?.type === 'UnaryExpression' && parent.operator === 'typeof';
}
//# sourceMappingURL=rule.js.map