import { useState } from 'react';
import { View } from 'react-native';
import { css, styled, useTheme } from 'kstyled';
import type { ShowcaseTheme } from '../../src/theme';
import {
  CodeBlock,
  CodeText,
  Content,
  DataLabel,
  DataRow,
  DataValue,
  PageHeader,
  Screen,
  Section,
  SectionHeader,
  SectionMeta,
  SectionTitle,
  ToolPanel,
} from '../../src/ui';

const BaseControl = styled.Pressable`
  min-height: 46px;
  padding: 12px 16px;
  border-radius: 7px;
  border-width: 1px;
  align-items: center;
  justify-content: center;
`;

const ComposedControl = styled(BaseControl)<{ $selected: boolean }>`
  border-color: ${(p) =>
    p.$selected ? p.theme.colors.accent : p.theme.colors.borderStrong};
  background-color: ${(p) =>
    p.$selected ? p.theme.colors.accent : p.theme.colors.surface};
`;

const ControlText = styled.Text<{ $selected: boolean }>`
  color: ${(p) => (p.$selected ? p.theme.colors.onAccent : p.theme.colors.ink)};
  font-size: 14px;
  font-weight: 700;
`;

const ButtonRow = styled.View`
  margin-horizontal: -5px;
  flex-direction: row;
  flex-wrap: wrap;
`;

const ButtonSlot = styled.View`
  min-width: 140px;
  margin: 5px;
  flex-grow: 1;
`;

export default function HybridExampleScreen() {
  const [selected, setSelected] = useState<'build' | 'preview'>('build');
  const theme = useTheme<ShowcaseTheme>();

  return (
    <Screen>
      <PageHeader
        title="Composition"
        subtitle="Extended styled components collapse to one render target while inline css compiles in place."
      />
      <Content>
        <Section>
          <SectionHeader>
            <SectionTitle>Extended control</SectionTitle>
            <SectionMeta>one native target</SectionMeta>
          </SectionHeader>
          <ToolPanel>
            <ButtonRow>
              {(['build', 'preview'] as const).map((value) => (
                <ButtonSlot key={value}>
                  <ComposedControl
                    $selected={selected === value}
                    onPress={() => setSelected(value)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: selected === value }}
                  >
                    <ControlText $selected={selected === value}>
                      {value}
                    </ControlText>
                  </ComposedControl>
                </ButtonSlot>
              ))}
            </ButtonRow>

            <View
              style={css`
                min-height: 74px;
                margin-top: 16px;
                padding: 14px;
                border-radius: 7px;
                border-width: 1px;
                border-color: ${theme.colors.border};
                justify-content: center;
                background-color: ${theme.colors.surfaceMuted};
              `}
            >
              <DataRow>
                <DataLabel>selected output</DataLabel>
                <DataValue $tone="accent">{selected}</DataValue>
              </DataRow>
            </View>

            <DataRow>
              <DataLabel>nested styled wrappers</DataLabel>
              <DataValue>collapsed</DataValue>
            </DataRow>
            <DataRow>
              <DataLabel>colliding style keys</DataLabel>
              <DataValue>preserved</DataValue>
            </DataRow>
            <DataRow>
              <DataLabel>inline css parser</DataLabel>
              <DataValue $tone="accent">skipped</DataValue>
            </DataRow>
          </ToolPanel>
        </Section>

        <Section>
          <SectionHeader>
            <SectionTitle>Source</SectionTitle>
            <SectionMeta>extension</SectionMeta>
          </SectionHeader>
          <CodeBlock>
            <CodeText>{`const Base = styled.Pressable\`...\`;

const Control = styled(Base)<{ $selected: boolean }>\`
  border-color: \${p => p.$selected
    ? p.theme.colors.accent
    : p.theme.colors.border};
\`;`}</CodeText>
          </CodeBlock>
        </Section>
      </Content>
    </Screen>
  );
}
