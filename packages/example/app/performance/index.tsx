import {
  Profiler,
  useCallback,
  useMemo,
  useRef,
  useState,
  type ProfilerOnRenderCallback,
} from 'react';
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

type SampleCount = '60' | '180' | '360';
type RenderMode = 'static' | 'dynamic';

interface Measurement {
  actual: number;
  base: number;
  phase: string;
}

const Control = styled.View`
  margin-top: 16px;
`;

const ControlLabel = styled.Text`
  margin-bottom: 7px;
  color: ${(p) => p.theme.colors.inkMuted};
  font-size: 12px;
  font-weight: 600;
`;

const RunButton = styled.Pressable`
  min-height: 44px;
  margin-top: 14px;
  border-radius: 7px;
  align-items: center;
  justify-content: center;
  background-color: ${(p) => p.theme.colors.accent};
`;

const RunLabel = styled.Text`
  color: ${(p) => p.theme.colors.onAccent};
  font-size: 14px;
  font-weight: 700;
`;

const ListSurface = styled.View`
  overflow: hidden;
  border-radius: 8px;
  border-width: 1px;
  border-color: ${(p) => p.theme.colors.border};
  background-color: ${(p) => p.theme.colors.surface};
`;

const StaticRow = styled.View`
  height: 38px;
  padding-horizontal: 12px;
  border-bottom-width: 1px;
  border-bottom-color: ${(p) => p.theme.colors.border};
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`;

const DynamicRow = styled(StaticRow)<{ $selected: boolean }>`
  background-color: ${(p) =>
    p.$selected ? p.theme.colors.surfaceMuted : p.theme.colors.surface};
  transform: translateX(${(p) => (p.$selected ? 2 : 0)}px);
`;

const RowLabel = styled.Text`
  color: ${(p) => p.theme.colors.ink};
  font-size: 12px;
  font-weight: 600;
`;

const RowValue = styled.Text`
  color: ${(p) => p.theme.colors.inkMuted};
  font-family: monospace;
  font-size: 11px;
`;

export default function PerformanceScreen() {
  const [sampleCount, setSampleCount] = useState<SampleCount>('60');
  const [mode, setMode] = useState<RenderMode>('static');
  const [revision, setRevision] = useState(0);
  const [measurement, setMeasurement] = useState<Measurement | null>(null);
  const shouldCapture = useRef(true);
  const count = Number(sampleCount);
  const rows = useMemo(
    () => Array.from({ length: count }, (_, index) => index),
    [count]
  );

  const captureNext = useCallback((update: () => void) => {
    shouldCapture.current = true;
    update();
  }, []);

  const onRender = useCallback<ProfilerOnRenderCallback>(
    (_id, phase, actualDuration, baseDuration) => {
      if (!shouldCapture.current) return;
      shouldCapture.current = false;
      const next = { actual: actualDuration, base: baseDuration, phase };
      setTimeout(() => setMeasurement(next), 0);
    },
    []
  );

  return (
    <Screen>
      <PageHeader
        title="Render profiler"
        subtitle="Measure React commit duration on the current device. Compare repeated runs under the same simulator conditions."
      />
      <Content>
        <Section>
          <SectionHeader>
            <SectionTitle>Profiler controls</SectionTitle>
            <SectionMeta>device local</SectionMeta>
          </SectionHeader>
          <ToolPanel>
            <PanelTitle>Render workload</PanelTitle>
            <BodyText>
              Static mode reads registered styles. Dynamic mode evaluates one
              transient prop and transform per row.
            </BodyText>
            <Control>
              <ControlLabel>Rows</ControlLabel>
              <SegmentedControl
                value={sampleCount}
                options={['60', '180', '360'] as const}
                onChange={(value) => captureNext(() => setSampleCount(value))}
                label="Rendered row count"
              />
            </Control>
            <Control>
              <ControlLabel>Style path</ControlLabel>
              <SegmentedControl
                value={mode}
                options={['static', 'dynamic'] as const}
                onChange={(value) => captureNext(() => setMode(value))}
                label="Style path"
              />
            </Control>
            <RunButton
              accessibilityRole="button"
              onPress={() =>
                captureNext(() => setRevision((value) => value + 1))
              }
            >
              <RunLabel>Run commit</RunLabel>
            </RunButton>

            <DataRow>
              <DataLabel>last actual duration</DataLabel>
              <DataValue $tone="accent">
                {measurement
                  ? `${measurement.actual.toFixed(2)} ms`
                  : 'pending'}
              </DataValue>
            </DataRow>
            <DataRow>
              <DataLabel>base duration</DataLabel>
              <DataValue>
                {measurement ? `${measurement.base.toFixed(2)} ms` : 'pending'}
              </DataValue>
            </DataRow>
            <DataRow>
              <DataLabel>phase</DataLabel>
              <DataValue>{measurement?.phase ?? 'mount'}</DataValue>
            </DataRow>
          </ToolPanel>
        </Section>

        <Section>
          <SectionHeader>
            <SectionTitle>Rendered rows</SectionTitle>
            <SectionMeta>{count} mounted</SectionMeta>
          </SectionHeader>
          <Profiler id="kstyled-list" onRender={onRender}>
            <ListSurface>
              {rows.map((index) =>
                mode === 'static' ? (
                  <StaticRow key={index}>
                    <RowLabel>
                      package-{String(index + 1).padStart(3, '0')}
                    </RowLabel>
                    <RowValue>r{revision}</RowValue>
                  </StaticRow>
                ) : (
                  <DynamicRow
                    key={index}
                    $selected={(index + revision) % 7 === 0}
                  >
                    <RowLabel>
                      package-{String(index + 1).padStart(3, '0')}
                    </RowLabel>
                    <RowValue>r{revision}</RowValue>
                  </DynamicRow>
                )
              )}
            </ListSurface>
          </Profiler>
        </Section>
      </Content>
    </Screen>
  );
}
