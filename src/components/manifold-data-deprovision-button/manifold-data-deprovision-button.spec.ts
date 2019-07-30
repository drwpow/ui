import { newSpecPage } from '@stencil/core/testing';
import fetchMock from 'fetch-mock';

import { Resource } from '../../spec/mock/marketplace';
import { connections } from '../../utils/connections';
import { ManifoldDataDeprovisionButton } from './manifold-data-deprovision-button';
import { createRestFetch } from '../../utils/restFetch';

/* eslint-disable @typescript-eslint/no-explicit-any */
const proto = ManifoldDataDeprovisionButton.prototype as any;
const oldCallback = proto.componentWillLoad;

proto.componentWillLoad = function() {
  (this as any).restFetch = createRestFetch({
    getAuthToken: jest.fn(() => '1234'),
    wait: 10,
    setAuthToken: jest.fn(),
  });

  if (oldCallback) {
    oldCallback.call(this);
  }
};

describe('<manifold-data-deprovision-button>', () => {
  it('fetches the resource id on load if not set', () => {
    const resourceLabel = 'test-resource';

    const provisionButton = new ManifoldDataDeprovisionButton();
    provisionButton.fetchResourceId = jest.fn();
    provisionButton.resourceLabel = resourceLabel;
    provisionButton.componentWillLoad();
    expect(provisionButton.fetchResourceId).toHaveBeenCalledWith(resourceLabel);
  });

  it('does not fetch the resource id on load if set', () => {
    const resourceLabel = 'test-resource';

    const provisionButton = new ManifoldDataDeprovisionButton();
    provisionButton.fetchResourceId = jest.fn();
    provisionButton.resourceLabel = resourceLabel;
    provisionButton.resourceId = resourceLabel;
    provisionButton.componentWillLoad();
    expect(provisionButton.fetchResourceId).not.toHaveBeenCalled();
  });

  it('fetches resource id on change if not set', () => {
    const resourceLabel = 'new-resource';

    const provisionButton = new ManifoldDataDeprovisionButton();
    provisionButton.fetchResourceId = jest.fn();
    provisionButton.resourceLabel = 'old-resource';

    provisionButton.labelChange(resourceLabel);
    expect(provisionButton.fetchResourceId).toHaveBeenCalledWith(resourceLabel);
  });

  it('does not resource id on change if set', () => {
    const resourceLabel = 'new-resource';

    const provisionButton = new ManifoldDataDeprovisionButton();
    provisionButton.fetchResourceId = jest.fn();
    provisionButton.resourceLabel = 'old-resource';
    provisionButton.resourceId = '1234';

    provisionButton.labelChange(resourceLabel);
    expect(provisionButton.fetchResourceId).not.toHaveBeenCalled();
  });

  describe('when created without a resource ID', () => {
    afterEach(() => {
      fetchMock.restore();
    });

    it('will fetch the resource id', async () => {
      const resourceLabel = 'new-resource';

      fetchMock.mock(`${connections.prod.marketplace}/resources/?me&label=${resourceLabel}`, [
        Resource,
      ]);

      const page = await newSpecPage({
        components: [ManifoldDataDeprovisionButton],
        html: `
          <manifold-data-deprovision-button
            resource-label="${resourceLabel}"
          >Deprovision</manifold-data-deprovision-button>
        `,
      });

      expect(
        fetchMock.called(`${connections.prod.marketplace}/resources/?me&label=${resourceLabel}`)
      ).toBe(true);

      const root = page.rootInstance as ManifoldDataDeprovisionButton;
      expect(root.resourceId).toEqual(Resource.id);
    });

    it('will do nothing on a fetch error', async () => {
      const resourceLabel = 'new-resource';

      fetchMock.mock(`${connections.prod.marketplace}/resources/?me&label=${resourceLabel}`, []);

      const page = await newSpecPage({
        components: [ManifoldDataDeprovisionButton],
        html: `
          <manifold-data-deprovision-button
            resource-label="${resourceLabel}"
          >Deprovision</manifold-data-deprovision-button>
        `,
      });

      expect(
        fetchMock.called(`${connections.prod.marketplace}/resources/?me&label=${resourceLabel}`)
      ).toBe(true);

      const root = page.rootInstance as ManifoldDataDeprovisionButton;
      expect(root.resourceId).not.toEqual(Resource.id);
    });
  });

  describe('When sending a request to deprovision', () => {
    afterEach(() => {
      fetchMock.restore();
    });

    beforeEach(() => {
      fetchMock.mock('path:/v1/resources/', [Resource]);
    });

    it('will trigger a dom event on successful deprovision', async () => {
      fetchMock.mock(`${connections.prod.gateway}/id/resource/${Resource.id}`, {
        status: 200,
        body: Resource,
      });

      const page = await newSpecPage({
        components: [ManifoldDataDeprovisionButton],
        html: `
          <manifold-data-deprovision-button
            resource-label="test"
          >Deprovision</manifold-data-deprovision-button>
        `,
      });

      const instance = page.rootInstance as ManifoldDataDeprovisionButton;
      instance.success.emit = jest.fn();

      await instance.deprovision();

      expect(fetchMock.called(`${connections.prod.gateway}/id/resource/${Resource.id}`)).toBe(true);
      expect(instance.success.emit).toHaveBeenCalledWith({
        message: 'test successfully deprovisioned',
        resourceLabel: 'test',
        resourceId: Resource.id,
      });
    });

    it('will trigger a dom event on failed deprovision', async () => {
      fetchMock.mock(`${connections.prod.gateway}/id/resource/${Resource.id}`, {
        status: 500,
        body: {
          message: 'ohnoes',
        },
      });

      const page = await newSpecPage({
        components: [ManifoldDataDeprovisionButton],
        html: `
          <manifold-data-deprovision-button
            resource-label="test"
          >Provision</manifold-data-deprovision-button>
        `,
      });

      const instance = page.rootInstance as ManifoldDataDeprovisionButton;
      instance.error.emit = jest.fn();

      await instance.deprovision();

      expect(fetchMock.called(`${connections.prod.gateway}/id/resource/${Resource.id}`)).toBe(true);
      expect(instance.error.emit).toHaveBeenCalledWith({
        message: 'ohnoes',
        resourceLabel: 'test',
        resourceId: Resource.id,
      });
    });

    it('will do nothing if still loading', async () => {
      fetchMock.mock(`${connections.prod.gateway}/id/resource/${Resource.id}`, 200);

      const page = await newSpecPage({
        components: [ManifoldDataDeprovisionButton],
        html: `
          <manifold-data-deprovision-button
            resource-label="test"
          >Provision</manifold-data-deprovision-button>
        `,
      });

      const instance = page.rootInstance as ManifoldDataDeprovisionButton;
      instance.loading = true;

      await instance.deprovision();

      expect(fetchMock.called(`${connections.prod.gateway}/id/resource/${Resource.id}`)).toBe(
        false
      );
    });

    it('will do nothing if no resourceId is provided', async () => {
      fetchMock.mock(`${connections.prod.gateway}/id/resource/${Resource.id}`, 200);

      const page = await newSpecPage({
        components: [ManifoldDataDeprovisionButton],
        html: `
          <manifold-data-deprovision-button
            resource-label="test"
          >Provision</manifold-data-deprovision-button>
        `,
      });

      const instance = page.rootInstance as ManifoldDataDeprovisionButton;
      instance.resourceId = undefined;

      await instance.deprovision();

      expect(fetchMock.called(`${connections.prod.gateway}/id/resource/${Resource.id}`)).toBe(
        false
      );
    });
  });
});
