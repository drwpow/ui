import { storiesOf } from '@storybook/html';
import markdown from '../src/components/manifold-data-provision-button/readme.md';

storiesOf('Provision Button [Data]', module)
  .addParameters({ readme: { sidebar: markdown } })
  .add(
    'default',
    () => `
  <label for="my-provision-button">Resource Name</label>
  <manifold-data-provision-button input-id="my-provision-button">
    🚀 Provision Business plan on Prefab.cloud
  </manifold-data-provision-button>`
  );
