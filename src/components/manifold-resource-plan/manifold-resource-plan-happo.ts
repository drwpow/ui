import { Resource } from '../../types/graphql';
import { resource } from '../../spec/mock/graphql';

export const skeleton = () => {
  const resourcePlan = document.createElement('manifold-resource-plan');
  resourcePlan.loading = true;

  document.body.appendChild(resourcePlan);
  return resourcePlan.componentOnReady();
};

export const loadedResource = () => {
  const resourcePlan = document.createElement('manifold-resource-plan');
  resourcePlan.gqlData = resource as Resource;

  document.body.appendChild(resourcePlan);
  return resourcePlan.componentOnReady();
};