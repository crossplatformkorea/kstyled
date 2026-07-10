import type { ReactNode } from 'react';
import { styled } from 'kstyled';
import { useShowcase } from './theme';

export const Screen = styled.ScrollView.attrs({
  contentInsetAdjustmentBehavior: 'automatic' as const,
  keyboardShouldPersistTaps: 'handled' as const,
  showsVerticalScrollIndicator: false,
  contentContainerStyle: { paddingBottom: 56 },
})`
  flex: 1;
  background-color: ${(p) => p.theme.colors.canvas};
`;

export const Content = styled.View`
  width: 100%;
  max-width: 720px;
  box-sizing: border-box;
  align-self: center;
  padding-horizontal: 18px;
`;

export const HeaderBand = styled.View`
  padding-top: 20px;
  padding-bottom: 18px;
  background-color: ${(p) => p.theme.colors.canvas};
  border-bottom-width: 1px;
  border-bottom-color: ${(p) => p.theme.colors.border};
`;

export const AppBar = styled.View`
  padding-vertical: 12px;
  background-color: ${(p) => p.theme.colors.surface};
  border-bottom-width: 1px;
  border-bottom-color: ${(p) => p.theme.colors.border};
`;

export const BrandRow = styled.View`
  min-height: 44px;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  column-gap: 12px;
`;

export const BrandLockup = styled.View`
  flex-direction: row;
  align-items: center;
`;

export const BrandMark = styled.View`
  width: 34px;
  height: 34px;
  border-radius: 6px;
  align-items: center;
  justify-content: center;
  background-color: ${(p) => p.theme.colors.ink};
  border-width: 2px;
  border-color: ${(p) => p.theme.colors.accent};
`;

export const BrandMarkText = styled.Text`
  color: ${(p) => p.theme.colors.canvas};
  font-size: 18px;
  font-weight: 800;
`;

export const BrandName = styled.Text`
  margin-left: 9px;
  color: ${(p) => p.theme.colors.ink};
  font-size: 17px;
  font-weight: 700;
`;

export const BetaBadge = styled.View`
  height: 22px;
  padding-horizontal: 7px;
  margin-left: 7px;
  border-radius: 4px;
  align-items: center;
  justify-content: center;
  background-color: ${(p) => p.theme.colors.surfaceMuted};
`;

export const BetaText = styled.Text`
  color: ${(p) => p.theme.colors.accent};
  font-size: 11px;
  font-weight: 700;
`;

export const PageTitle = styled.Text`
  color: ${(p) => p.theme.colors.ink};
  font-size: 25px;
  line-height: 31px;
  font-weight: 800;
`;

export const PageSubtitle = styled.Text`
  max-width: 620px;
  margin-top: 7px;
  color: ${(p) => p.theme.colors.inkMuted};
  font-size: 14px;
  line-height: 21px;
`;

export const PageHeadingRow = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  row-gap: 12px;
  column-gap: 16px;
`;

export const Section = styled.View`
  padding-top: 24px;
`;

export const SectionHeader = styled.View`
  margin-bottom: 12px;
  flex-direction: row;
  align-items: flex-end;
  justify-content: space-between;
`;

export const SectionTitle = styled.Text`
  color: ${(p) => p.theme.colors.ink};
  font-size: 18px;
  font-weight: 700;
`;

export const SectionMeta = styled.Text`
  color: ${(p) => p.theme.colors.inkMuted};
  font-size: 12px;
  font-weight: 600;
`;

export const ToolPanel = styled.View`
  padding: 16px;
  border-radius: 6px;
  border-width: 1px;
  border-color: ${(p) => p.theme.colors.border};
  background-color: ${(p) => p.theme.colors.surface};
`;

export const PanelTitle = styled.Text`
  color: ${(p) => p.theme.colors.ink};
  font-size: 15px;
  font-weight: 700;
`;

export const BodyText = styled.Text`
  color: ${(p) => p.theme.colors.inkMuted};
  font-size: 14px;
  line-height: 21px;
`;

export const Divider = styled.View`
  height: 1px;
  margin-vertical: 16px;
  background-color: ${(p) => p.theme.colors.border};
`;

export const Segmented = styled.View`
  min-height: 40px;
  padding: 3px;
  border-radius: 7px;
  flex-direction: row;
  background-color: ${(p) => p.theme.colors.surfaceMuted};
`;

const SegmentButton = styled.Pressable<{ $active: boolean }>`
  min-width: 68px;
  min-height: 34px;
  padding-horizontal: 12px;
  border-radius: 5px;
  align-items: center;
  justify-content: center;
  background-color: ${(p) =>
    p.$active ? p.theme.colors.surface : 'transparent'};
`;

const SegmentLabel = styled.Text<{ $active: boolean }>`
  color: ${(p) => (p.$active ? p.theme.colors.ink : p.theme.colors.inkMuted)};
  font-size: 12px;
  font-weight: ${(p) => (p.$active ? '700' : '500')};
`;

export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <Segmented accessibilityRole="radiogroup" accessibilityLabel={label}>
      {options.map((option) => {
        const active = option === value;
        return (
          <SegmentButton
            key={option}
            $active={active}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(option)}
          >
            <SegmentLabel $active={active}>{option}</SegmentLabel>
          </SegmentButton>
        );
      })}
    </Segmented>
  );
}

const ThemeControl = styled.View`
  flex-direction: row;
  align-items: center;
`;

const ThemeControlLabel = styled.Text`
  margin-right: 8px;
  color: ${(p) => p.theme.colors.inkMuted};
  font-size: 12px;
  font-weight: 600;
`;

const ThemeSwitch = styled.Switch``;

export function ThemeToggle() {
  const { mode, setMode, theme } = useShowcase();
  return (
    <ThemeControl>
      <ThemeControlLabel>Dark</ThemeControlLabel>
      <ThemeSwitch
        accessibilityLabel="Dark mode"
        value={mode === 'dark'}
        onValueChange={(enabled) => setMode(enabled ? 'dark' : 'light')}
        trackColor={{
          false: theme.colors.borderStrong,
          true: theme.colors.accent,
        }}
        thumbColor={theme.colors.surface}
        ios_backgroundColor={theme.colors.borderStrong}
      />
    </ThemeControl>
  );
}

export const DataRow = styled.View`
  min-height: 42px;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  border-bottom-width: 1px;
  border-bottom-color: ${(p) => p.theme.colors.border};
`;

export const DataLabel = styled.Text`
  color: ${(p) => p.theme.colors.inkMuted};
  font-size: 13px;
`;

export const DataValue = styled.Text<{
  $tone?: 'accent' | 'coral' | 'default';
}>`
  color: ${(p) => {
    if (p.$tone === 'accent') return p.theme.colors.accent;
    if (p.$tone === 'coral') return p.theme.colors.coral;
    return p.theme.colors.ink;
  }};
  font-size: 13px;
  font-weight: 700;
`;

export const CodeBlock = styled.View`
  padding: 16px;
  border-radius: 8px;
  background-color: ${(p) => p.theme.colors.code};
`;

export const CodeText = styled.Text`
  color: #dde8e1;
  font-family: monospace;
  font-size: 12px;
  line-height: 19px;
`;

export function PageHeader({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children?: ReactNode;
}) {
  return (
    <HeaderBand>
      <Content>
        <PageHeadingRow>
          <PageTitle>{title}</PageTitle>
          <ThemeToggle />
        </PageHeadingRow>
        <PageSubtitle>{subtitle}</PageSubtitle>
        {children}
      </Content>
    </HeaderBand>
  );
}

export function AppHeader() {
  return (
    <AppBar>
      <Content>
        <BrandRow>
          <BrandLockup>
            <BrandMark>
              <BrandMarkText>K</BrandMarkText>
            </BrandMark>
            <BrandName>kstyled</BrandName>
            <BetaBadge>
              <BetaText>beta</BetaText>
            </BetaBadge>
          </BrandLockup>
          <ThemeToggle />
        </BrandRow>
      </Content>
    </AppBar>
  );
}
