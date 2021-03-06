import { newSpecPage } from '@stencil/core/testing';
import fetchMock from 'fetch-mock';

import { ResourceWithOwnerQuery } from '../../types/graphql';
import resource from '../../spec/mock/elegant-cms/resource';
import { ManifoldResourceSso } from './manifold-resource-sso';
import { ManifoldDataSsoButton } from '../manifold-data-sso-button/manifold-data-sso-button';

interface Props {
  disabled?: boolean;
  gqlData?: ResourceWithOwnerQuery['resource'];
  loading?: boolean;
  ownerId?: string;
}

async function setup(props: Props) {
  const page = await newSpecPage({
    components: [ManifoldResourceSso, ManifoldDataSsoButton],
    html: '<div></div>',
  });

  const component = page.doc.createElement('manifold-resource-sso');
  component.disabled = props.disabled;
  component.ownerId = props.ownerId;
  component.gqlData = props.gqlData;
  component.loading = props.loading;

  const root = page.root as HTMLDivElement;
  root.appendChild(component);
  await page.waitForChanges();

  return { page, component };
}

describe('<manifold-resource-sso>', () => {
  beforeEach(() => {
    fetchMock.mock('begin:https://analytics.manifold.co', 200);
    fetchMock.mock('begin:https://api.manifold.co', 200);
  });

  afterEach(fetchMock.restore);

  describe('v0 props', () => {
    it('[disabled]: disables button', async () => {
      const { page } = await setup({ disabled: true });
      const button = page.root && page.root.querySelector('button');
      expect(button && button.getAttribute('disabled')).not.toBeNull();
    });

    it('[gqlData]: button disabled if missing', async () => {
      const { page } = await setup({});
      const button = page.root && page.root.querySelector('button');
      expect(button && button.getAttribute('disabled')).not.toBeNull();
    });

    it('[gqlData]: button not disabled if present', async () => {
      const { page } = await setup({
        loading: false,
        gqlData: resource as ResourceWithOwnerQuery['resource'],
      });
      const button = page.root && page.root.querySelector('button');
      expect(button && button.getAttribute('disabled')).toBeNull();
    });

    it('[owner-id]: passes to child', async () => {
      const { page } = await setup({ ownerId: 'my-owner-id' });
      const button = page.root && page.root.querySelector('manifold-data-sso-button');
      expect(button && button.ownerId).toBe('my-owner-id');
    });
  });
});
