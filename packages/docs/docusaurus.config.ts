import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'kstyled',
  tagline: 'Compile-time CSS-in-JS for React Native',
  favicon: 'img/favicon.ico',

  url: 'https://crossplatformkorea.github.io',
  baseUrl: '/kstyled/',

  organizationName: 'crossplatformkorea',
  projectName: 'kstyled',

  onBrokenLinks: 'throw',

  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl:
            'https://github.com/crossplatformkorea/kstyled/tree/main/packages/docs/',
          routeBasePath: '/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/social-card.png',
    navbar: {
      title: 'kstyled',
      logo: {
        alt: 'kstyled Logo',
        src: 'img/logo.png',
        href: '/kstyled/intro',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Docs',
        },
        {
          href: 'https://github.com/crossplatformkorea/kstyled',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Getting Started',
              to: '/kstyled/intro',
            },
            {
              label: 'API Reference',
              to: '/kstyled/api',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/crossplatformkorea/kstyled',
            },
            {
              label: 'npm',
              href: 'https://www.npmjs.com/package/kstyled',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Cross Platform Korea. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
