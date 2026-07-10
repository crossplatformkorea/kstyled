import { useState } from 'react';
import { styled } from 'kstyled';
import {
  BodyText,
  Content,
  DataLabel,
  DataRow,
  DataValue,
  PageHeader,
  PanelTitle,
  Screen,
  Section,
  SectionHeader,
  SectionMeta,
  SectionTitle,
  SegmentedControl,
  ToolPanel,
} from '../../src/ui';

type Signal = 'healthy' | 'warning' | 'critical';
type Motion = 'steady' | 'lifted';

const Preview = styled.View`
  min-height: 180px;
  margin-top: 16px;
  padding: 18px;
  border-radius: 8px;
  justify-content: center;
  background-color: ${(p) => p.theme.colors.surfaceMuted};
`;

const SignalCard = styled.Pressable<{ $signal: Signal; $motion: Motion }>`
  min-height: 104px;
  padding: ${(p) => (p.$motion === 'lifted' ? 18 : 14)}px
    ${(p) => (p.$motion === 'lifted' ? 20 : 16)}px;
  border-radius: 8px;
  border-width: 1px;
  border-color: ${(p) => {
    if (p.$signal === 'critical') return p.theme.colors.coral;
    if (p.$signal === 'warning') return p.theme.colors.amber;
    return p.theme.colors.accent;
  }};
  transform: translateY(${(p) => (p.$motion === 'lifted' ? -5 : 0)}px)
    scale(${(p) => (p.$motion === 'lifted' ? 1.01 : 1)});
  background-color: ${(p) => p.theme.colors.surface};
`;

const SignalTitle = styled.Text`
  color: ${(p) => p.theme.colors.ink};
  font-size: 16px;
  font-weight: 700;
`;

const SignalCopy = styled.Text`
  margin-top: 5px;
  color: ${(p) => p.theme.colors.inkMuted};
  font-size: 13px;
`;

const Track = styled.View`
  height: 6px;
  margin-top: 16px;
  border-radius: 3px;
  overflow: hidden;
  background-color: ${(p) => p.theme.colors.surfaceMuted};
`;

const Fill = styled.View<{ $signal: Signal }>`
  width: ${(p) =>
    p.$signal === 'healthy' ? '34%' : p.$signal === 'warning' ? '68%' : '94%'};
  height: 6px;
  border-radius: 3px;
  background-color: ${(p) => {
    if (p.$signal === 'critical') return p.theme.colors.coral;
    if (p.$signal === 'warning') return p.theme.colors.amber;
    return p.theme.colors.accent;
  }};
`;

const Control = styled.View`
  margin-top: 16px;
`;

const ControlLabel = styled.Text`
  margin-bottom: 7px;
  color: ${(p) => p.theme.colors.inkMuted};
  font-size: 12px;
  font-weight: 600;
`;

export default function DynamicExampleScreen() {
  const [signal, setSignal] = useState<Signal>('healthy');
  const [motion, setMotion] = useState<Motion>('steady');

  return (
    <Screen>
      <PageHeader
        title="Dynamic props"
        subtitle="Only interpolated values run during render; transient props stay out of the native view."
      />
      <Content>
        <Section>
          <SectionHeader>
            <SectionTitle>Signal component</SectionTitle>
            <SectionMeta>live patch</SectionMeta>
          </SectionHeader>
          <ToolPanel>
            <PanelTitle>Service health</PanelTitle>
            <BodyText>Switch state and motion independently.</BodyText>
            <Control>
              <ControlLabel>Signal</ControlLabel>
              <SegmentedControl
                value={signal}
                options={['healthy', 'warning', 'critical'] as const}
                onChange={setSignal}
                label="Signal state"
              />
            </Control>
            <Control>
              <ControlLabel>Motion</ControlLabel>
              <SegmentedControl
                value={motion}
                options={['steady', 'lifted'] as const}
                onChange={setMotion}
                label="Motion state"
              />
            </Control>
            <Preview>
              <SignalCard
                $signal={signal}
                $motion={motion}
                accessibilityRole="button"
                onPress={() =>
                  setMotion(motion === 'steady' ? 'lifted' : 'steady')
                }
              >
                <SignalTitle>
                  {signal === 'healthy'
                    ? 'All systems nominal'
                    : signal === 'warning'
                      ? 'Capacity nearing limit'
                      : 'Action required'}
                </SignalTitle>
                <SignalCopy>
                  $signal and $motion are consumed by styles only.
                </SignalCopy>
                <Track>
                  <Fill $signal={signal} />
                </Track>
              </SignalCard>
            </Preview>
            <DataRow>
              <DataLabel>native $signal prop</DataLabel>
              <DataValue>filtered</DataValue>
            </DataRow>
            <DataRow>
              <DataLabel>dynamic transform</DataLabel>
              <DataValue $tone="coral">compiled</DataValue>
            </DataRow>
            <DataRow>
              <DataLabel>static declarations</DataLabel>
              <DataValue $tone="accent">registered</DataValue>
            </DataRow>
          </ToolPanel>
        </Section>
      </Content>
    </Screen>
  );
}
