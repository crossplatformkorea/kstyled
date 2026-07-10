import { styled, useTheme } from 'kstyled';
import type { ShowcaseTheme } from '../../src/theme';
import {
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

const SwatchRow = styled.View`
  margin-horizontal: -5px;
  flex-direction: row;
  flex-wrap: wrap;
`;

const Swatch = styled.View<{ $color: string }>`
  min-width: 138px;
  min-height: 94px;
  margin: 5px;
  padding: 13px;
  border-radius: 8px;
  border-width: 1px;
  border-color: ${(p) => p.theme.colors.border};
  flex-grow: 1;
  justify-content: flex-end;
  background-color: ${(p) => p.$color};
`;

const SwatchLabel = styled.Text<{ $light?: boolean }>`
  color: ${(p) => (p.$light ? '#FFFFFF' : '#17211D')};
  font-size: 12px;
  font-weight: 700;
`;

const ThemePreview = styled.View`
  min-height: 130px;
  padding: 18px;
  border-radius: 8px;
  border-width: 1px;
  border-color: ${(p) => p.theme.colors.border};
  justify-content: center;
  background-color: ${(p) => p.theme.colors.surfaceMuted};
`;

const PreviewTitle = styled.Text`
  color: ${(p) => p.theme.colors.ink};
  font-size: 18px;
  font-weight: 700;
`;

const PreviewCopy = styled.Text`
  margin-top: 6px;
  color: ${(p) => p.theme.colors.inkMuted};
  font-size: 13px;
  line-height: 20px;
`;

export default function ThemeExampleScreen() {
  const theme = useTheme<ShowcaseTheme>();

  return (
    <Screen>
      <PageHeader
        title="Theme system"
        subtitle="Toggle light and dark mode in the header; every dynamic token updates through one provider."
      />
      <Content>
        <Section>
          <SectionHeader>
            <SectionTitle>Active palette</SectionTitle>
            <SectionMeta>{theme.isDark ? 'dark' : 'light'} mode</SectionMeta>
          </SectionHeader>
          <SwatchRow>
            <Swatch $color={theme.colors.accent}>
              <SwatchLabel $light={!theme.isDark}>accent</SwatchLabel>
            </Swatch>
            <Swatch $color={theme.colors.coral}>
              <SwatchLabel $light={!theme.isDark}>coral</SwatchLabel>
            </Swatch>
            <Swatch $color={theme.colors.amber}>
              <SwatchLabel $light={!theme.isDark}>amber</SwatchLabel>
            </Swatch>
            <Swatch $color={theme.colors.blue}>
              <SwatchLabel $light={!theme.isDark}>blue</SwatchLabel>
            </Swatch>
          </SwatchRow>
        </Section>

        <Section>
          <SectionHeader>
            <SectionTitle>Provider output</SectionTitle>
            <SectionMeta>typed hook</SectionMeta>
          </SectionHeader>
          <ToolPanel>
            <ThemePreview>
              <PreviewTitle>
                {theme.isDark ? 'Dark surface' : 'Light surface'}
              </PreviewTitle>
              <PreviewCopy>
                useTheme&lt;ShowcaseTheme&gt;() exposes the same object consumed
                by styled interpolations.
              </PreviewCopy>
            </ThemePreview>
            <DataRow>
              <DataLabel>canvas</DataLabel>
              <DataValue>{theme.colors.canvas}</DataValue>
            </DataRow>
            <DataRow>
              <DataLabel>surface</DataLabel>
              <DataValue>{theme.colors.surface}</DataValue>
            </DataRow>
            <DataRow>
              <DataLabel>accent</DataLabel>
              <DataValue $tone="accent">{theme.colors.accent}</DataValue>
            </DataRow>
          </ToolPanel>
        </Section>
      </Content>
    </Screen>
  );
}
