import { h, Component, Element, Prop, Event, EventEmitter } from '@stencil/core';

import { connection } from '../../global/app';
import logger, { loadMark } from '../../utils/logger';
import { GraphqlFetch } from '../../utils/graphqlFetch';
import ssoByLabel from './sso-label.graphql';
import ssoByID from './sso-id.graphql';
import {
  ResourceSsoByIdQuery,
  ResourceSsoByLabelQuery,
  ResourceSsoByIdQueryVariables,
  ResourceSsoByLabelQueryVariables,
} from '../../types/graphql';

interface ClickMessage {
  resourceLabel?: string;
  resourceId?: string;
}

interface SuccessMessage {
  message: string;
  resourceLabel?: string;
  resourceId?: string;
  redirectUrl?: string;
}

interface ErrorMessage {
  message: string;
  resourceLabel?: string;
  resourceId?: string;
}

@Component({ tag: 'manifold-data-sso-button' })
export class ManifoldDataSsoButton {
  @Element() el: HTMLElement;
  /** _(hidden)_ */
  @Prop() graphqlFetch?: GraphqlFetch = connection.graphqlFetch;
  @Prop() disabled?: boolean;
  @Prop() ownerId?: string;
  /** The label of the resource to rename */
  @Prop() resourceLabel?: string;
  /** The id of the resource to rename, will be fetched if not set */
  @Prop() resourceId?: string;
  @Prop() loading?: boolean = false;
  @Event({ eventName: 'manifold-ssoButton-click', bubbles: true }) click: EventEmitter;
  @Event({ eventName: 'manifold-ssoButton-error', bubbles: true }) error: EventEmitter;
  @Event({ eventName: 'manifold-ssoButton-success', bubbles: true }) success: EventEmitter;

  @loadMark()
  componentWillLoad() {}

  sso = async () => {
    if (!this.graphqlFetch || this.loading) {
      return;
    }

    const clickMessage: ClickMessage = {
      resourceLabel: this.resourceLabel,
      resourceId: this.resourceId,
    };
    this.click.emit(clickMessage);

    const variables: ResourceSsoByIdQueryVariables | ResourceSsoByLabelQueryVariables = this
      .resourceId
      ? { resourceId: this.resourceId, owner: this.ownerId }
      : { resourceLabel: this.resourceLabel || '', owner: this.ownerId };
    const { data, errors } = await this.graphqlFetch<
      ResourceSsoByIdQuery | ResourceSsoByLabelQuery
    >({
      query: this.resourceId ? ssoByID : ssoByLabel,
      variables,
      element: this.el,
    });

    if (data && data.resource) {
      // this event is VERY important! without redirectUrl this component is useless
      const success: SuccessMessage = {
        message: `${this.resourceLabel} successfully authenticated`,
        resourceLabel: data.resource.label,
        resourceId: data.resource.id,
        redirectUrl: data.resource.ssoUrl,
      };
      this.success.emit(success);
    }

    if (errors) {
      errors.forEach(({ message }) => {
        const error: ErrorMessage = {
          message,
          resourceLabel: this.resourceLabel,
          resourceId: this.resourceId,
        };

        this.error.emit(error);
      });
    }
  };

  @logger()
  render() {
    return (
      <button
        type="submit"
        onClick={this.sso}
        disabled={this.disabled || this.loading}
        data-resource-id={this.resourceId}
      >
        <slot />
      </button>
    );
  }
}
