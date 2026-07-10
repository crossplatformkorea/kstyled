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
  ToolPanel,
} from '../../src/ui';

const BaseInput = styled.TextInput.attrs({
  accessibilityLabel: 'Package name',
  autoCapitalize: 'none' as const,
  autoCorrect: false,
  placeholder: '@scope/package',
})`
  min-height: 46px;
  padding: 11px 13px;
  border-radius: 7px;
  border-width: 1px;
  border-color: ${(p) => p.theme.colors.borderStrong};
  color: ${(p) => p.theme.colors.ink};
  background-color: ${(p) => p.theme.colors.surface};
  font-size: 15px;
`;

const PackageInput = BaseInput.attrs({
  testID: 'package-name-input',
  returnKeyType: 'done' as const,
});

const FieldLabel = styled.Text`
  margin-bottom: 7px;
  color: ${(p) => p.theme.colors.ink};
  font-size: 13px;
  font-weight: 700;
`;

const SubmitButton = styled.Pressable.attrs({
  accessibilityRole: 'button' as const,
  accessibilityHint: 'Validates the package name',
})<{ $valid: boolean }>`
  min-height: 44px;
  margin-top: 12px;
  border-radius: 7px;
  align-items: center;
  justify-content: center;
  opacity: ${(p) => (p.$valid ? 1 : 0.45)};
  background-color: ${(p) => p.theme.colors.accent};
`;

const SubmitLabel = styled.Text`
  color: ${(p) => p.theme.colors.onAccent};
  font-size: 14px;
  font-weight: 700;
`;

export default function AttrsExampleScreen() {
  const [packageName, setPackageName] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const valid = /^(@[a-z0-9-]+\/)?[a-z0-9-]+$/.test(packageName);

  return (
    <Screen>
      <PageHeader
        title="Attrs and inputs"
        subtitle="Defaults, accessibility metadata, and optional TypeScript props travel with the component."
      />
      <Content>
        <Section>
          <SectionHeader>
            <SectionTitle>Package validator</SectionTitle>
            <SectionMeta>attrs chain</SectionMeta>
          </SectionHeader>
          <ToolPanel>
            <PanelTitle>Publish target</PanelTitle>
            <BodyText>
              The field owns its placeholder, input policy, accessibility label,
              return key, and test ID.
            </BodyText>
            <FieldLabel>Package name</FieldLabel>
            <PackageInput
              value={packageName}
              onChangeText={(value) => {
                setPackageName(value.toLowerCase());
                setSubmitted(false);
              }}
              placeholderTextColor="#839087"
              onSubmitEditing={() => valid && setSubmitted(true)}
            />
            <SubmitButton
              $valid={valid}
              disabled={!valid}
              accessibilityState={{ disabled: !valid }}
              onPress={() => setSubmitted(true)}
            >
              <SubmitLabel>
                {submitted ? 'Package name accepted' : 'Validate package'}
              </SubmitLabel>
            </SubmitButton>

            <DataRow>
              <DataLabel>accessibilityLabel</DataLabel>
              <DataValue>defaulted</DataValue>
            </DataRow>
            <DataRow>
              <DataLabel>testID</DataLabel>
              <DataValue>chained</DataValue>
            </DataRow>
            <DataRow>
              <DataLabel>consumer override</DataLabel>
              <DataValue $tone="accent">supported</DataValue>
            </DataRow>
          </ToolPanel>
        </Section>
      </Content>
    </Screen>
  );
}
