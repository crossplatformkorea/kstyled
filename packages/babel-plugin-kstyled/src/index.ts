/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Babel Plugin for kstyled
 * Based on Linaria's build-time extraction pattern
 *
 * Key improvements:
 * 1. Proper state management with TypeScript
 * 2. Cleaner AST manipulation
 * 3. Better error handling
 * 4. Simpler transformation strategy
 */

import type { PluginObj, NodePath, PluginPass } from '@babel/core';
import * as t from '@babel/types';
import { addNamed } from '@babel/helper-module-imports';
import { parseCSS, parseCSSValue } from './css-parser';
import type { PluginOptions } from './types';

interface PluginState extends PluginPass {
  opts: PluginOptions;
  styledImportName: string | null;
  cssImportName: string | null;
  styleSheetImportName: string | null;
  styleCounter: number;
}

/**
 * Build CSS string from template parts
 */
function buildCSSString(
  strings: string[],
  expressions: t.Expression[]
): { css: string; expressionMap: Map<string, t.Expression> } {
  let css = '';
  const expressionMap = new Map<string, t.Expression>();

  for (let i = 0; i < strings.length; i++) {
    css += strings[i];
    if (i < expressions.length) {
      const placeholder = `__EXPR_${i}__`;
      css += placeholder;
      expressionMap.set(placeholder, expressions[i]);
    }
  }

  return { css, expressionMap };
}

/**
 * Generate StyleSheet.create AST node
 */
function generateStyleSheet(
  styleId: string,
  styles: Record<string, any>,
  styleSheetName: string
): t.VariableDeclaration {
  const properties: t.ObjectProperty[] = [];

  for (const [key, value] of Object.entries(styles)) {
    properties.push(t.objectProperty(toPropertyKey(key), valueToNode(value)));
  }

  const styleObject = t.objectExpression(properties);
  const createCall = t.callExpression(
    t.memberExpression(t.identifier(styleSheetName), t.identifier('create')),
    [t.objectExpression([t.objectProperty(t.identifier('base'), styleObject)])]
  );
  t.addComment(createCall, 'leading', '#__PURE__');

  return t.variableDeclaration('const', [
    t.variableDeclarator(t.identifier(styleId), createCall),
  ]);
}

function toPropertyKey(key: string): t.Identifier | t.StringLiteral {
  return t.isValidIdentifier(key) ? t.identifier(key) : t.stringLiteral(key);
}

function valueToNode(value: unknown): t.Expression {
  if (value === null) {
    return t.nullLiteral();
  }
  if (typeof value === 'string') {
    return t.stringLiteral(value);
  }
  if (typeof value === 'number') {
    return Number.isFinite(value)
      ? t.numericLiteral(value)
      : t.identifier(String(value));
  }
  if (typeof value === 'boolean') {
    return t.booleanLiteral(value);
  }
  if (Array.isArray(value)) {
    return t.arrayExpression(value.map((item) => valueToNode(item)));
  }
  if (typeof value === 'object') {
    return t.objectExpression(
      Object.entries(value).map(([key, nestedValue]) =>
        t.objectProperty(toPropertyKey(key), valueToNode(nestedValue))
      )
    );
  }

  return t.identifier('undefined');
}

function resolveInterpolation(
  expression: t.Expression,
  propsArgument: t.Expression
): t.Expression {
  if (
    t.isArrowFunctionExpression(expression) ||
    t.isFunctionExpression(expression)
  ) {
    return t.callExpression(expression, [propsArgument]);
  }

  return t.cloneNode(expression, true);
}

function generateInterpolatedExpression(
  value: string,
  expressionMap: Map<string, t.Expression>,
  propsArgument: t.Expression
): t.Expression | undefined {
  const exactExpression = expressionMap.get(value);
  if (exactExpression) {
    return resolveInterpolation(exactExpression, propsArgument);
  }

  const pattern = /__EXPR_\d+__/g;
  const expressions: t.Expression[] = [];
  const quasis: t.TemplateElement[] = [];
  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(value)) !== null) {
    const expression = expressionMap.get(match[0]);
    if (!expression) {
      return undefined;
    }

    quasis.push(
      t.templateElement(
        {
          raw: value.slice(cursor, match.index),
          cooked: value.slice(cursor, match.index),
        },
        false
      )
    );
    expressions.push(resolveInterpolation(expression, propsArgument));
    cursor = pattern.lastIndex;
  }

  if (expressions.length === 0) {
    return undefined;
  }

  quasis.push(
    t.templateElement(
      { raw: value.slice(cursor), cooked: value.slice(cursor) },
      true
    )
  );
  return t.templateLiteral(quasis, expressions);
}

function generateDynamicTransform(
  value: string,
  expressionMap: Map<string, t.Expression>,
  propsArgument: t.Expression
): t.ArrayExpression | undefined {
  const transforms: t.Expression[] = [];
  const transformPattern = /([a-zA-Z][\w]*)\(([^()]*)\)/g;
  let cursor = 0;
  let match: RegExpExecArray | null;

  const resolveArgument = (
    rawValue: string,
    stripUnit: boolean
  ): t.Expression | undefined => {
    const normalizedValue = stripUnit
      ? rawValue.trim().replace(/(px|em|rem|pt)$/i, '')
      : rawValue.trim();
    return (
      generateInterpolatedExpression(
        normalizedValue,
        expressionMap,
        propsArgument
      ) ?? valueToNode(parseCSSValue(normalizedValue))
    );
  };

  while ((match = transformPattern.exec(value)) !== null) {
    if (value.slice(cursor, match.index).trim()) {
      return undefined;
    }

    const name = match[1];
    const rawValue = match[2].trim();
    if (name === 'translate') {
      const parts = rawValue.split(/[,\s]+/).filter(Boolean);
      if (parts.length < 1 || parts.length > 2) {
        return undefined;
      }
      transforms.push(
        t.objectExpression([
          t.objectProperty(
            t.identifier('translateX'),
            resolveArgument(parts[0], true)!
          ),
        ])
      );
      if (parts[1]) {
        transforms.push(
          t.objectExpression([
            t.objectProperty(
              t.identifier('translateY'),
              resolveArgument(parts[1], true)!
            ),
          ])
        );
      }
    } else if (name === 'matrix') {
      const parts = rawValue.split(/[,\s]+/).filter(Boolean);
      if (parts.length !== 9 && parts.length !== 16) {
        return undefined;
      }
      transforms.push(
        t.objectExpression([
          t.objectProperty(
            t.identifier('matrix'),
            t.arrayExpression(
              parts.map((part) => resolveArgument(part, false)!)
            )
          ),
        ])
      );
    } else {
      const isAngle =
        name === 'rotate' ||
        name === 'rotateX' ||
        name === 'rotateY' ||
        name === 'rotateZ' ||
        name === 'skewX' ||
        name === 'skewY';
      const isNumeric =
        name === 'perspective' ||
        name === 'scale' ||
        name === 'scaleX' ||
        name === 'scaleY' ||
        name === 'translateX' ||
        name === 'translateY';

      if (!isAngle && !isNumeric) {
        return undefined;
      }

      const argument = resolveArgument(
        rawValue,
        !isAngle && (name === 'perspective' || name.startsWith('translate'))
      );
      if (!argument) {
        return undefined;
      }
      transforms.push(
        t.objectExpression([t.objectProperty(toPropertyKey(name), argument)])
      );
    }

    cursor = transformPattern.lastIndex;
  }

  return value.slice(cursor).trim() || transforms.length === 0
    ? undefined
    : t.arrayExpression(transforms);
}

function resolveDynamicValue(
  key: string,
  value: string,
  expressionMap: Map<string, t.Expression>,
  propsArgument: t.Expression
): t.Expression | undefined {
  if (key === 'transform') {
    return generateDynamicTransform(value, expressionMap, propsArgument);
  }

  return generateInterpolatedExpression(value, expressionMap, propsArgument);
}

function generateDynamicStyleObject(
  expressionMap: Map<string, t.Expression>,
  dynamicProps: Array<{ key: string; placeholder: string }>,
  propsArgument: t.Expression,
  normalizer?: t.Expression,
  declarationNormalizer?: t.Expression
): t.ObjectExpression | undefined {
  const properties: Array<t.ObjectProperty | t.SpreadElement> = [];

  for (const { key, placeholder } of dynamicProps) {
    const expression = resolveDynamicValue(
      key,
      placeholder,
      expressionMap,
      propsArgument
    );
    if (expression) {
      if (declarationNormalizer && (key === 'padding' || key === 'margin')) {
        properties.push(
          t.spreadElement(
            t.callExpression(t.cloneNode(declarationNormalizer), [
              t.stringLiteral(key),
              expression,
            ])
          )
        );
        continue;
      }

      const normalizedExpression = normalizer
        ? t.callExpression(t.cloneNode(normalizer), [
            t.stringLiteral(key),
            expression,
          ])
        : expression;
      properties.push(
        t.objectProperty(toPropertyKey(key), normalizedExpression)
      );
    }
  }

  return properties.length > 0 ? t.objectExpression(properties) : undefined;
}

/**
 * Generate dynamic patch function
 */
function generateDynamicPatch(
  expressionMap: Map<string, t.Expression>,
  dynamicProps: Array<{ key: string; placeholder: string }>
): t.ArrowFunctionExpression | undefined {
  const styleObject = generateDynamicStyleObject(
    expressionMap,
    dynamicProps,
    t.identifier('p')
  );
  if (!styleObject) return undefined;

  return t.arrowFunctionExpression([t.identifier('p')], styleObject);
}

function reportTransformError(
  path: NodePath,
  state: PluginState,
  target: string,
  error: unknown
): void {
  const detail = error instanceof Error ? error.message : String(error);
  const message = `[babel-plugin-kstyled] Failed to compile ${target}: ${detail}`;

  if (state.opts.strict) {
    throw path.buildCodeFrameError(message);
  }

  console.error(message);
}

export default function babelPluginKStyled(): PluginObj<PluginState> {
  return {
    name: 'babel-plugin-kstyled',

    visitor: {
      Program: {
        enter(_path, state) {
          state.styledImportName = null;
          state.cssImportName = null;
          state.styleSheetImportName = null;
          state.styleCounter = 0;
        },
      },

      ImportDeclaration(path, state) {
        const source = path.node.source.value;
        const opts = (state.opts as PluginOptions) || {};
        const importName = opts.importName || 'kstyled';

        if (source === importName) {
          if (opts.debug) {
            console.log(
              '[babel-plugin-kstyled] Found import from:',
              importName
            );
          }
          for (const spec of path.node.specifiers) {
            if (t.isImportSpecifier(spec) && t.isIdentifier(spec.imported)) {
              if (spec.imported.name === 'styled') {
                state.styledImportName = spec.local.name;
                if (opts.debug) {
                  console.log(
                    '[babel-plugin-kstyled] Found styled import as:',
                    spec.local.name
                  );
                }
              } else if (spec.imported.name === 'css') {
                state.cssImportName = spec.local.name;
                if (opts.debug) {
                  console.log(
                    '[babel-plugin-kstyled] Found css import as:',
                    spec.local.name
                  );
                }
              }
            }
          }
        }
      },

      TaggedTemplateExpression(path, state) {
        const opts = (state.opts as PluginOptions) || {};

        if (opts.debug) {
          console.log('[babel-plugin-kstyled] TaggedTemplateExpression found');
          console.log(
            '[babel-plugin-kstyled] styledImportName:',
            state.styledImportName
          );
          console.log(
            '[babel-plugin-kstyled] cssImportName:',
            state.cssImportName
          );
        }

        // Check if this is a css`` pattern
        if (
          t.isIdentifier(path.node.tag) &&
          path.node.tag.name === state.cssImportName
        ) {
          if (opts.debug) {
            console.log('[babel-plugin-kstyled] Matched css`` pattern');
          }

          try {
            // Extract CSS from template
            const quasi = path.node.quasi;
            const strings = quasi.quasis.map(
              (q) => q.value.cooked || q.value.raw
            );
            const expressions = quasi.expressions as t.Expression[];

            const { css, expressionMap } = buildCSSString(strings, expressions);

            // Parse CSS
            const parsed = parseCSS(css);

            // Generate unique style ID
            const styleId = `__ks${state.styleCounter++}`;

            // Collect dynamic properties
            const dynamicProps: Array<{ key: string; placeholder: string }> =
              [];

            for (const [key, value] of Object.entries(parsed.static)) {
              if (typeof value === 'string' && value.includes('__EXPR_')) {
                dynamicProps.push({ key, placeholder: value });
                delete parsed.static[key];
              }
            }

            for (const dynamicStyle of parsed.dynamic) {
              for (const [key, value] of Object.entries(
                dynamicStyle.properties
              )) {
                if (typeof value === 'string' && value.includes('__EXPR_')) {
                  dynamicProps.push({ key, placeholder: value });
                }
              }
            }

            // Generate AST nodes
            let styleSheetNode: t.VariableDeclaration | undefined;
            if (Object.keys(parsed.static).length > 0) {
              if (!state.styleSheetImportName) {
                const program = path.findParent((p) =>
                  p.isProgram()
                ) as NodePath<t.Program>;
                const importedName = addNamed(
                  program,
                  'StyleSheet',
                  'react-native'
                );
                state.styleSheetImportName = importedName.name;
              }
              styleSheetNode = generateStyleSheet(
                styleId,
                parsed.static,
                state.styleSheetImportName!
              );
            }

            const dynamicStyle = generateDynamicStyleObject(
              expressionMap,
              dynamicProps,
              t.objectExpression([]),
              t.memberExpression(
                t.identifier(state.cssImportName!),
                t.identifier('__normalizeStyleValue')
              ),
              t.memberExpression(
                t.identifier(state.cssImportName!),
                t.identifier('__normalizeStyleDeclaration')
              )
            );

            // Insert StyleSheet at top of file if we have one
            if (styleSheetNode) {
              const program = path.findParent((p) =>
                p.isProgram()
              ) as NodePath<t.Program>;

              if (program) {
                const lastImportIndex = program.node.body.findIndex(
                  (node) => !t.isImportDeclaration(node)
                );
                const insertIndex =
                  lastImportIndex === -1 ? 0 : lastImportIndex;
                program.node.body.splice(insertIndex, 0, styleSheetNode);
              }
            }

            const styleExpressions: t.Expression[] = [];
            if (styleSheetNode) {
              styleExpressions.push(
                t.memberExpression(t.identifier(styleId), t.identifier('base'))
              );
            }
            if (dynamicStyle) {
              styleExpressions.push(dynamicStyle);
            }

            const compiledStyle =
              styleExpressions.length === 0
                ? t.objectExpression([])
                : styleExpressions.length === 1
                  ? styleExpressions[0]
                  : t.arrayExpression(styleExpressions);

            path.replaceWith(compiledStyle);

            if (opts.debug) {
              console.log('[babel-plugin-kstyled] Transformed css``:');
              console.log('  Static:', parsed.static);
              console.log('  Dynamic props:', dynamicProps.length);
            }
          } catch (error) {
            reportTransformError(path, state, 'css`` template', error);
          }

          return;
        }

        let styledCall: t.CallExpression | null = null;
        let attrsMetadata: t.Expression | null = null;

        // Check if this is styled(Component)`...`, styled.View`...`, or styled(Component).attrs(...)`...`
        if (t.isCallExpression(path.node.tag)) {
          // Case 1: styled(Component)`...`
          if (
            t.isIdentifier(path.node.tag.callee) &&
            path.node.tag.callee.name === state.styledImportName
          ) {
            const componentArg = path.node.tag.arguments[0];

            // Special handling for styled(Animated.View) pattern
            if (
              t.isMemberExpression(componentArg) &&
              t.isIdentifier(componentArg.object) &&
              componentArg.object.name === 'Animated' &&
              t.isIdentifier(componentArg.property)
            ) {
              const componentName = componentArg.property.name;
              if (opts.debug) {
                console.log(
                  `[babel-plugin-kstyled] Detected styled(Animated.${componentName}), transforming...`
                );
              }

              // Transform styled(Animated.View) to:
              // styled(Animated.createAnimatedComponent(View))
              const program = path.findParent((p) =>
                p.isProgram()
              ) as NodePath<t.Program>;
              const importedComponent = addNamed(
                program,
                componentName,
                'react-native'
              );

              // Create: Animated.createAnimatedComponent(View)
              const createAnimatedCall = t.callExpression(
                t.memberExpression(
                  t.identifier(componentArg.object.name), // 'Animated'
                  t.identifier('createAnimatedComponent')
                ),
                [importedComponent]
              );

              // Replace the component argument
              path.node.tag.arguments[0] = createAnimatedCall;

              if (opts.debug) {
                console.log(
                  `[babel-plugin-kstyled] Transformed to: styled(Animated.createAnimatedComponent(${componentName}))\`...\``
                );
              }
            }

            styledCall = path.node.tag;
            if (opts.debug) {
              let componentName = 'unknown';
              if (t.isIdentifier(componentArg)) {
                componentName = componentArg.name;
              } else if (t.isMemberExpression(componentArg)) {
                componentName = 'MemberExpression (transformed)';
              } else if (t.isCallExpression(componentArg)) {
                componentName = 'CallExpression (Animated component)';
              }
              console.log(
                `[babel-plugin-kstyled] Matched Case 1: styled(${componentName})\`...\``
              );
            }
          }
          // Case 2: styled(Component).attrs(...)`...`
          else if (
            t.isMemberExpression(path.node.tag.callee) &&
            t.isIdentifier(path.node.tag.callee.property) &&
            path.node.tag.callee.property.name === 'attrs' &&
            t.isCallExpression(path.node.tag.callee.object) &&
            t.isIdentifier(path.node.tag.callee.object.callee) &&
            path.node.tag.callee.object.callee.name === state.styledImportName
          ) {
            styledCall = path.node.tag.callee.object;
            attrsMetadata = path.node.tag.arguments[0] as t.Expression;
            if (opts.debug) {
              console.log(
                '[babel-plugin-kstyled] Matched Case 2: styled(Component).attrs(...)`...`'
              );
            }
          }
          // Case 3: styled.View.attrs(...)`...`
          else if (
            t.isMemberExpression(path.node.tag.callee) &&
            t.isIdentifier(path.node.tag.callee.property) &&
            path.node.tag.callee.property.name === 'attrs' &&
            t.isMemberExpression(path.node.tag.callee.object) &&
            t.isIdentifier(path.node.tag.callee.object.object) &&
            path.node.tag.callee.object.object.name ===
              state.styledImportName &&
            t.isIdentifier(path.node.tag.callee.object.property)
          ) {
            const componentName = path.node.tag.callee.object.property.name;
            const program = path.findParent((p) =>
              p.isProgram()
            ) as NodePath<t.Program>;
            const importedComponent = addNamed(
              program,
              componentName,
              'react-native'
            );
            styledCall = t.callExpression(
              t.identifier(state.styledImportName!),
              [importedComponent]
            );
            attrsMetadata = path.node.tag.arguments[0] as t.Expression;
            if (opts.debug) {
              console.log(
                `[babel-plugin-kstyled] Matched Case 3: styled.${componentName}.attrs(...)\`...\``
              );
            }
          }
        }
        // Case 4: styled.View`...` or styled.Text`...`
        else if (
          t.isMemberExpression(path.node.tag) &&
          t.isIdentifier(path.node.tag.object) &&
          path.node.tag.object.name === state.styledImportName &&
          t.isIdentifier(path.node.tag.property)
        ) {
          // Import the React Native component
          const componentName = path.node.tag.property.name;
          const program = path.findParent((p) =>
            p.isProgram()
          ) as NodePath<t.Program>;
          const importedComponent = addNamed(
            program,
            componentName,
            'react-native'
          );

          // Create a CallExpression: styled(ImportedComponent)
          styledCall = t.callExpression(t.identifier(state.styledImportName!), [
            importedComponent,
          ]);
          if (opts.debug) {
            console.log(
              `[babel-plugin-kstyled] Matched Case 3: styled.${componentName}\`...\``
            );
          }
        }
        // Case 5: styled.View.attrs`...` (missing attrs invocation)
        else if (
          t.isMemberExpression(path.node.tag) &&
          t.isIdentifier(path.node.tag.property) &&
          path.node.tag.property.name === 'attrs' &&
          t.isMemberExpression(path.node.tag.object) &&
          t.isIdentifier(path.node.tag.object.object) &&
          path.node.tag.object.object.name === state.styledImportName
        ) {
          if (opts.debug) {
            console.log(
              '[babel-plugin-kstyled] Invalid pattern: styled.View.attrs (missing attrs invocation)'
            );
          }
        }

        if (!styledCall) {
          if (opts.debug) {
            console.log('[babel-plugin-kstyled] No match, skipping');
          }
          return;
        }

        try {
          // Extract CSS from template
          const quasi = path.node.quasi;
          const strings = quasi.quasis.map(
            (q) => q.value.cooked || q.value.raw
          );
          const expressions = quasi.expressions as t.Expression[];

          const { css, expressionMap } = buildCSSString(strings, expressions);

          if (opts.debug) {
            console.log('[babel-plugin-kstyled] Built CSS string:', css);
            console.log(
              '[babel-plugin-kstyled] Expression map size:',
              expressionMap.size
            );
          }

          // Parse CSS
          const parsed = parseCSS(css);

          if (opts.debug) {
            console.log(
              '[babel-plugin-kstyled] Parsed static styles:',
              Object.keys(parsed.static)
            );
            for (const [key, value] of Object.entries(parsed.static)) {
              console.log(
                `[babel-plugin-kstyled]   ${key}: ${JSON.stringify(value)}`
              );
            }
          }

          // Generate unique style ID
          const styleId = `__ks${state.styleCounter++}`;

          // Collect dynamic properties
          const dynamicProps: Array<{ key: string; placeholder: string }> = [];

          if (opts.debug) {
            console.log(
              '[babel-plugin-kstyled] Checking for dynamic props in parsed.static:'
            );
            for (const [key, value] of Object.entries(parsed.static)) {
              console.log(
                `[babel-plugin-kstyled]   ${key}: ${JSON.stringify(value)} (type: ${typeof value})`
              );
            }
            console.log(
              '[babel-plugin-kstyled] parsed.dynamic:',
              parsed.dynamic
            );
          }

          // First, collect from parsed.static (edge case where __EXPR_ ends up in static)
          for (const [key, value] of Object.entries(parsed.static)) {
            if (typeof value === 'string' && value.includes('__EXPR_')) {
              if (opts.debug) {
                console.log(
                  `[babel-plugin-kstyled]   → Moving ${key} from static to dynamicProps`
                );
              }
              dynamicProps.push({ key, placeholder: value });
              delete parsed.static[key];
            }
          }

          // Then, collect from parsed.dynamic (main source of dynamic values)
          for (const dynamicStyle of parsed.dynamic) {
            for (const [key, value] of Object.entries(
              dynamicStyle.properties
            )) {
              if (typeof value === 'string' && value.includes('__EXPR_')) {
                if (opts.debug) {
                  console.log(
                    `[babel-plugin-kstyled]   → Adding ${key} from dynamic to dynamicProps`
                  );
                }
                dynamicProps.push({ key, placeholder: value });
              }
            }
          }

          if (opts.debug) {
            console.log(
              '[babel-plugin-kstyled] Final dynamicProps:',
              dynamicProps
            );
          }

          // Generate AST nodes
          let styleSheetNode: t.VariableDeclaration | undefined;
          if (Object.keys(parsed.static).length > 0) {
            if (!state.styleSheetImportName) {
              const program = path.findParent((p) =>
                p.isProgram()
              ) as NodePath<t.Program>;
              const importedName = addNamed(
                program,
                'StyleSheet',
                'react-native'
              );
              state.styleSheetImportName = importedName.name;
            }
            styleSheetNode = generateStyleSheet(
              styleId,
              parsed.static,
              state.styleSheetImportName!
            );
          }

          const dynamicPatch = generateDynamicPatch(
            expressionMap,
            dynamicProps
          );

          // Build metadata object
          const metadataProps: t.ObjectProperty[] = [];

          if (styleSheetNode) {
            metadataProps.push(
              t.objectProperty(
                t.identifier('compiledStyles'),
                t.identifier(styleId)
              ),
              t.objectProperty(
                t.identifier('styleKeys'),
                t.arrayExpression([t.stringLiteral('base')])
              )
            );
          }

          if (dynamicPatch) {
            metadataProps.push(
              t.objectProperty(t.identifier('getDynamicPatch'), dynamicPatch)
            );
          }

          if (attrsMetadata) {
            metadataProps.push(
              t.objectProperty(t.identifier('attrs'), attrsMetadata)
            );
          }

          // Add debug flag if enabled
          if (state.opts.debug) {
            metadataProps.push(
              t.objectProperty(t.identifier('debug'), t.booleanLiteral(true))
            );
          }

          // Insert StyleSheet at top of file if we have one
          if (styleSheetNode) {
            const program = path.findParent((p) =>
              p.isProgram()
            ) as NodePath<t.Program>;

            if (program) {
              const lastImportIndex = program.node.body.findIndex(
                (node) => !t.isImportDeclaration(node)
              );
              const insertIndex = lastImportIndex === -1 ? 0 : lastImportIndex;
              program.node.body.splice(insertIndex, 0, styleSheetNode);
            }
          }

          // Keep the styled component contract intact. The runtime has a
          // dedicated static fast path while preserving attrs, as, refs,
          // transient prop filtering, and style extension metadata.
          const withStylesCall = t.callExpression(
            t.memberExpression(styledCall, t.identifier('__withStyles')),
            [t.objectExpression(metadataProps)]
          );
          t.addComment(withStylesCall, 'leading', '#__PURE__');

          path.replaceWith(withStylesCall);

          if (opts.debug) {
            console.log('[babel-plugin-kstyled] Transformed:');
            console.log('  Static:', parsed.static);
            console.log('  Dynamic props:', dynamicProps.length);
          }
        } catch (error) {
          reportTransformError(path, state, 'styled template', error);
        }
      },
    },
  };
}

export type { PluginOptions } from './types';
