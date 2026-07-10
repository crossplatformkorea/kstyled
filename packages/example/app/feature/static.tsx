import { Text, View } from 'react-native';
import { css, styled } from 'kstyled';
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

const TileRow = styled.View`
  margin-horizontal: -5px;
  flex-direction: row;
  flex-wrap: wrap;
`;

const StaticTile = styled.View`
  min-width: 140px;
  min-height: 118px;
  margin: 5px;
  padding: 16px;
  border-radius: 8px;
  border-width: 1px;
  border-color: #d5ddd8;
  flex-grow: 1;
  justify-content: space-between;
  background-color: #ffffff;
`;

const TileLabel = styled.Text`
  color: #66736c;
  font-size: 12px;
  font-weight: 600;
`;

const TileValue = styled.Text`
  color: #17211d;
  font-size: 22px;
  font-weight: 800;
`;

const NativeBadge = styled.View`
  align-self: flex-start;
  padding: 5px 8px;
  border-radius: 4px;
  background-color: #087a55;
`;

const NativeBadgeText = styled.Text`
  color: #ffffff;
  font-size: 11px;
  font-weight: 700;
`;

export default function StaticExampleScreen() {
  return (
    <Screen>
      <PageHeader
        title="Static extraction"
        subtitle="Templates with fixed values become registered React Native styles at build time."
      />
      <Content>
        <Section>
          <SectionHeader>
            <SectionTitle>Compiled surface</SectionTitle>
            <SectionMeta>no CSS parsing</SectionMeta>
          </SectionHeader>
          <TileRow>
            <StaticTile>
              <TileLabel>padding</TileLabel>
              <TileValue>16</TileValue>
              <NativeBadge>
                <NativeBadgeText>STATIC</NativeBadgeText>
              </NativeBadge>
            </StaticTile>
            <StaticTile>
              <TileLabel>radius</TileLabel>
              <TileValue>8</TileValue>
              <NativeBadge>
                <NativeBadgeText>STATIC</NativeBadgeText>
              </NativeBadge>
            </StaticTile>
            <StaticTile>
              <TileLabel>elevation</TileLabel>
              <TileValue>2</TileValue>
              <NativeBadge>
                <NativeBadgeText>STATIC</NativeBadgeText>
              </NativeBadge>
            </StaticTile>
          </TileRow>
        </Section>

        <Section>
          <SectionHeader>
            <SectionTitle>Inline css output</SectionTitle>
            <SectionMeta>function scope</SectionMeta>
          </SectionHeader>
          <ToolPanel>
            <View
              style={css`
                min-height: 64px;
                padding: 14px;
                border-radius: 7px;
                border-left-width: 4px;
                border-left-color: #315f8c;
                justify-content: center;
                background-color: #e8f0f7;
              `}
            >
              <Text
                style={css`
                  color: #234766;
                  font-size: 14px;
                  font-weight: 700;
                `}
              >
                This object is emitted directly by Babel.
              </Text>
            </View>
            <DataRow>
              <DataLabel>StyleSheet.create</DataLabel>
              <DataValue $tone="accent">yes</DataValue>
            </DataRow>
            <DataRow>
              <DataLabel>runtime parser</DataLabel>
              <DataValue>skipped</DataValue>
            </DataRow>
            <DataRow>
              <DataLabel>style reference</DataLabel>
              <DataValue>reused</DataValue>
            </DataRow>
          </ToolPanel>
        </Section>

        <Section>
          <SectionHeader>
            <SectionTitle>Source</SectionTitle>
            <SectionMeta>styled shortcut</SectionMeta>
          </SectionHeader>
          <CodeBlock>
            <CodeText>{`const Tile = styled.View\`
  min-height: 118px;
  padding: 16px;
  border-radius: 8px;
  background-color: #FFFFFF;
\`;`}</CodeText>
          </CodeBlock>
        </Section>
      </Content>
    </Screen>
  );
}
