const { fs, path } = require('@vuepress/shared-utils');

module.exports = {
  dest: './dist',
  locales: {
    '/': {
      lang: 'fr-FR',
      title: '📚 RPC tech',
      description: 'Documentation technique du Registre de preuve de covoiturage',
    },
  },
  theme: 'openapi',
  themeConfig: {
    logo: '/logo-rpc.png',
    locales: {
      '/': {
        nav: [
          { text: 'Opérateurs', link: '/operateurs/' },
          { text: 'Développeurs', link: '/contribuer/api/' },
          { text: 'Repo', link: '/contribuer/repo/' },
        ],
        sidebar: {
          '/operateurs/': [
            {
              title: 'API',
              children: [
                {
                  title: "Accès",
                  path: 'acces',
                },
                {
                  title: "Référence",
                  path: 'api-v2',
                },
                {
                  title: 'Limites',
                  path: 'limites',
                },
              ],
            },
            {
              title: 'Trajets',
              children: [
                {
                  title: "Schemas",
                  path: 'preuves/schemas'
                },
                {
                  title: "Exemples",
                  path: 'preuves/exemples'
                },
              ],
            },
            {
              title: 'Attestations',
              children: [
                {
                  title: "Fonctionnalités",
                  path: 'attestations/fonctionnalites'
                },
                {
                  title: "Exemples",
                  path: 'attestations/exemples'
                },
              ],
            },
            {
              title: 'Outils',
              path: '/operateurs/outils',
            },
          ],
          '/contribuer/repo/': [
            {
              title: 'Repository',
              path: '/contribuer/repo/'
            },
            {
              title: 'Process',
              path: '/contribuer/repo/process'
            },
            {
              title: 'CI/CD',
              path: '/contribuer/repo/cicd'
            },
            {
              title: 'Infra',
              path: '/contribuer/repo/infra'
            }
          ],
          '/contribuer/api/': [
            {
              title: 'API',
              path: '/contribuer/api/',
            },
            {
              title: 'Proxy',
              path: '/contribuer/api/proxy',
            },
            {
              title: 'Services',
              path: '/contribuer/api/services/',
              children: getChildren('/contribuer/api/services'),
            },
            {
              title: 'Providers',
              path: '/contribuer/api/providers/',
              children: getChildren('/contribuer/api/providers'),
            },
            {
              title: 'Licences',
              path: '/contribuer/api/licenses-list',
            },
          ],
        },
      },
    },
  },
};

function getChildren(fullPath) {
  return fs
    .readdirSync(path.resolve(__dirname, `../${fullPath}`))
    .filter((s) => !new RegExp('.md$', 'i').test(s))
    .map((s) => `${fullPath}/${s}/`)
    .sort();
}
