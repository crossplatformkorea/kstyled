import { useState } from 'react';
import { Platform } from 'react-native';
import { type Href, useRouter } from 'expo-router';
import { styled } from 'kstyled';
import packageJson from '../package.json';
import {
  AppHeader,
  Content,
  DataLabel,
  DataRow,
  DataValue,
  Screen,
  Section,
  SectionHeader,
  SectionMeta,
  SectionTitle,
  SegmentedControl,
  ToolPanel,
} from '../src/ui';

type DemoState = 'ready' | 'busy' | 'disabled';
type Density = 'compact' | 'comfortable';

const WorkspaceHeader = styled.View`
  padding-top: 24px;
`;

const WorkspaceKicker = styled.Text`
  color: ${(p) => p.theme.colors.accent};
  font-size: 11px;
  font-weight: 800;
`;

const WorkspaceTitle = styled.Text`
  margin-top: 5px;
  color: ${(p) => p.theme.colors.ink};
  font-size: 25px;
  line-height: 31px;
  font-weight: 800;
`;

const WorkspaceMeta = styled.Text`
  margin-top: 6px;
  color: ${(p) => p.theme.colors.inkMuted};
  font-size: 13px;
`;

const BuildStatus = styled.View`
  padding-top: 14px;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
`;

const StatusItem = styled.View`
  margin-right: 18px;
  margin-bottom: 6px;
  flex-direction: row;
  align-items: center;
`;

const StatusDot = styled.View`
  width: 7px;
  height: 7px;
  margin-right: 7px;
  border-radius: 4px;
  background-color: ${(p) => p.theme.colors.accent};
`;

const StatusText = styled.Text`
  color: ${(p) => p.theme.colors.inkMuted};
  font-size: 12px;
  font-weight: 600;
`;

const ControlGrid = styled.View`
  margin-horizontal: -5px;
  flex-direction: row;
  flex-wrap: wrap;
`;

const ControlSlot = styled.View`
  min-width: 220px;
  margin: 5px;
  flex-grow: 1;
`;

const ControlLabel = styled.Text`
  margin-bottom: 7px;
  color: ${(p) => p.theme.colors.inkMuted};
  font-size: 12px;
  font-weight: 600;
`;

const PreviewSurface = styled.View`
  min-height: 132px;
  margin-top: 14px;
  padding: 18px;
  border-radius: 6px;
  align-items: center;
  justify-content: center;
  background-color: ${(p) => p.theme.colors.surfaceMuted};
`;

const DemoAction = styled.Pressable<{
  $state: DemoState;
  $density: Density;
}>`
  min-width: 190px;
  min-height: ${(p) => (p.$density === 'compact' ? 40 : 48)}px;
  padding: ${(p) => (p.$density === 'compact' ? 9 : 13)}px
    ${(p) => (p.$density === 'compact' ? 16 : 22)}px;
  border-radius: 6px;
  align-items: center;
  justify-content: center;
  opacity: ${(p) => (p.$state === 'disabled' ? 0.42 : 1)};
  transform: scale(${(p) => (p.$state === 'busy' ? 0.98 : 1)});
  background-color: ${(p) =>
    p.$state === 'busy' ? p.theme.colors.blue : p.theme.colors.accent};
`;

const DemoActionText = styled.Text`
  color: ${(p) => p.theme.colors.onAccent};
  font-size: 14px;
  font-weight: 700;
`;

const ResultTable = styled.View`
  margin-top: 14px;
  border-top-width: 1px;
  border-top-color: ${(p) => p.theme.colors.border};
`;

const RouteList = styled.View`
  border-top-width: 1px;
  border-top-color: ${(p) => p.theme.colors.border};
`;

const RouteRow = styled.Pressable`
  min-height: 70px;
  padding-vertical: 12px;
  border-bottom-width: 1px;
  border-bottom-color: ${(p) => p.theme.colors.border};
  flex-direction: row;
  align-items: center;
`;

const RouteIndex = styled.Text`
  width: 34px;
  color: ${(p) => p.theme.colors.inkMuted};
  font-family: monospace;
  font-size: 11px;
  font-weight: 700;
`;

const RouteContent = styled.View`
  flex: 1;
  min-width: 0px;
`;

const RouteTitle = styled.Text`
  color: ${(p) => p.theme.colors.ink};
  font-size: 14px;
  font-weight: 700;
`;

const RouteMeta = styled.Text`
  margin-top: 3px;
  color: ${(p) => p.theme.colors.inkMuted};
  font-size: 12px;
`;

const RouteAction = styled.Text`
  margin-left: 12px;
  color: ${(p) => p.theme.colors.accent};
  font-size: 12px;
  font-weight: 800;
`;

const RouteArrow = styled.Text`
  margin-left: 8px;
  color: ${(p) => p.theme.colors.inkMuted};
  font-size: 16px;
  font-weight: 700;
`;

const routes = [
  {
    title: 'Static extraction',
    meta: 'registered StyleSheet output',
    route: '/feature/static',
  },
  {
    title: 'Dynamic props',
    meta: 'transient props and transforms',
    route: '/feature/dynamic',
  },
  {
    title: 'Composition',
    meta: 'extension and inline css',
    route: '/feature/hybrid',
  },
  {
    title: 'Attrs and inputs',
    meta: 'typed defaults and native props',
    route: '/feature/attrs',
  },
  {
    title: 'Theme system',
    meta: 'provider and typed tokens',
    route: '/feature/theme',
  },
  {
    title: 'Render profiler',
    meta: 'device-local commit timing',
    route: '/performance',
  },
] as const;

export default function HomeScreen() {
  const router = useRouter();
  const [state, setState] = useState<DemoState>('ready');
  const [density, setDensity] = useState<Density>('comfortable');

  return (
    <Screen>
      <AppHeader />
      <Content>
        <WorkspaceHeader>
          <WorkspaceKicker>LOCAL WORKSPACE</WorkspaceKicker>
          <WorkspaceTitle>Component workbench</WorkspaceTitle>
          <WorkspaceMeta>
            {packageJson.version} / Expo 54 / {Platform.OS}
          </WorkspaceMeta>
          <BuildStatus>
            <StatusItem>
              <StatusDot />
              <StatusText>Babel strict</StatusText>
            </StatusItem>
            <StatusItem>
              <StatusDot />
              <StatusText>workspace package</StatusText>
            </StatusItem>
            <StatusItem>
              <StatusDot />
              <StatusText>native renderer</StatusText>
            </StatusItem>
          </BuildStatus>
        </WorkspaceHeader>

        <Section>
          <SectionHeader>
            <SectionTitle>Interactive preview</SectionTitle>
            <SectionMeta>
              {state} / {density}
            </SectionMeta>
          </SectionHeader>
          <ToolPanel>
            <ControlGrid>
              <ControlSlot>
                <ControlLabel>State</ControlLabel>
                <SegmentedControl
                  value={state}
                  options={['ready', 'busy', 'disabled'] as const}
                  onChange={setState}
                  label="Component state"
                />
              </ControlSlot>
              <ControlSlot>
                <ControlLabel>Density</ControlLabel>
                <SegmentedControl
                  value={density}
                  options={['compact', 'comfortable'] as const}
                  onChange={setDensity}
                  label="Component density"
                />
              </ControlSlot>
            </ControlGrid>

            <PreviewSurface>
              <DemoAction
                $state={state}
                $density={density}
                disabled={state === 'disabled'}
                accessibilityRole="button"
                accessibilityState={{
                  disabled: state === 'disabled',
                  busy: state === 'busy',
                }}
                onPress={() => setState(state === 'ready' ? 'busy' : 'ready')}
              >
                <DemoActionText>
                  {state === 'busy'
                    ? 'Building package...'
                    : state === 'disabled'
                      ? 'Release unavailable'
                      : 'Build beta package'}
                </DemoActionText>
              </DemoAction>
            </PreviewSurface>

            <ResultTable>
              <DataRow>
                <DataLabel>static styles</DataLabel>
                <DataValue $tone="accent">registered</DataValue>
              </DataRow>
              <DataRow>
                <DataLabel>dynamic values</DataLabel>
                <DataValue $tone="coral">evaluated</DataValue>
              </DataRow>
              <DataRow>
                <DataLabel>transient props</DataLabel>
                <DataValue>filtered</DataValue>
              </DataRow>
            </ResultTable>
          </ToolPanel>
        </Section>

        <Section>
          <SectionHeader>
            <SectionTitle>Feature tests</SectionTitle>
            <SectionMeta>{routes.length} surfaces</SectionMeta>
          </SectionHeader>
          <RouteList>
            {routes.map((item, index) => (
              <RouteRow
                key={item.route}
                accessibilityRole="button"
                accessibilityLabel={`Open ${item.title}`}
                onPress={() => router.push(item.route as Href)}
              >
                <RouteIndex>{String(index + 1).padStart(2, '0')}</RouteIndex>
                <RouteContent>
                  <RouteTitle>{item.title}</RouteTitle>
                  <RouteMeta>{item.meta}</RouteMeta>
                </RouteContent>
                <RouteAction>OPEN</RouteAction>
                <RouteArrow>&gt;</RouteArrow>
              </RouteRow>
            ))}
          </RouteList>
        </Section>
      </Content>
    </Screen>
  );
}
