import { resource } from '../../spec/mock/graphql';

export const skeleton = () => {
  const resourceCreds = document.createElement('manifold-resource-credentials');
  document.body.appendChild(resourceCreds);
  return resourceCreds.componentOnReady();
};

export const loadedResource = async () => {
  const resourceCreds = document.createElement('manifold-resource-credentials');
  document.body.appendChild(resourceCreds);
  await resourceCreds.componentOnReady();

  resourceCreds.gqlData = resource;
  resourceCreds.loading = false;

  return resourceCreds.componentOnReady();
};
