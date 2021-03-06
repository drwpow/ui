import { h, Component } from '@stencil/core';
import logger, { loadMark } from '../../utils/logger';

@Component({
  tag: 'manifold-skeleton-text',
  styleUrl: 'manifold-skeleton-text.css',
  shadow: true,
})
export class ManifoldSkeletonText {
  @loadMark()
  componentWillLoad() {}

  @logger()
  render() {
    return (
      <div class="wrapper">
        <slot />
      </div>
    );
  }
}
