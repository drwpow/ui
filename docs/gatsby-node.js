const { resolve } = require('path');

exports.createPages = ({ actions, graphql }) => {
  const { createPage } = actions;
  const component = resolve('src/pages/index.tsx');

  return graphql(`
    {
      allMarkdownRemark(sort: { fields: [frontmatter___title], order: ASC }, limit: 1000) {
        edges {
          node {
            frontmatter {
              path
            }
          }
        }
      }
    }
  `).then(result => {
    if (result.errors) {
      return Promise.reject(result.errors);
    }

    return result.data.allMarkdownRemark.edges.forEach(({ node: { frontmatter: { path } } }) => {
      createPage({ path, component });
    });
  });
};