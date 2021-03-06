import { h, Component, Element, Prop, State, Watch, Event, EventEmitter } from '@stencil/core';

import { AuthToken } from '../../types/auth';
import { connection, Subscriber } from '../../global/app';
import logger, { loadMark } from '../../utils/logger';
import { report } from '../../utils/errorReport';

export type AuthType = 'oauth' | 'manual';

@Component({ tag: 'manifold-auth-token' })
export class ManifoldAuthToken {
  @Element() el: HTMLElement;
  /** _(hidden)_ */
  @Prop() setAuthToken?: (s: string) => void = connection.setAuthToken;
  /** _(hidden)_ */
  @Prop() subscribe?: (s: Subscriber) => () => void = connection.subscribe;
  /* Authorisation header token that can be used to authenticate the user in manifold */
  @Prop() token?: string;
  @Prop() authType?: AuthType = 'oauth';
  @State() tick?: string;
  @State() internalToken?: string;
  @Event({ eventName: 'manifold-token-receive', bubbles: true })
  manifoldOauthTokenChange: EventEmitter<{ token: string }>;
  @Event({ eventName: 'manifold-token-clear', bubbles: true }) clear: EventEmitter;

  private unsubscribe = () => {};

  @Watch('token') tokenChange(newToken?: string) {
    this.setExternalToken(newToken);
  }

  @loadMark()
  componentWillLoad() {
    this.setExternalToken(this.token);
    if (this.subscribe) {
      this.unsubscribe = this.subscribe((newToken?: string) => {
        this.internalToken = newToken;
        if (!newToken) {
          // changing this to any new string will cause a token refresh. getTime() does that wonderfully.
          this.tick = new Date().getTime().toString();
          this.clear.emit();
        }
      });
    }
  }

  componentDidUnload() {
    this.unsubscribe();
  }

  setExternalToken(token?: string) {
    if (token && this.setAuthToken) {
      this.setAuthToken(token);
      this.internalToken = token;
      this.manifoldOauthTokenChange.emit({ token });
    }
  }

  setInternalToken = (e: CustomEvent) => {
    const payload = e.detail as AuthToken;

    if (payload.error) {
      report(
        {
          code: payload.error.code.toString(),
          message: payload.error.message,
        },
        { element: this.el, env: connection.env }
      );
      return;
    }

    if (!payload.error && payload.expiry && payload.token) {
      if (this.setAuthToken) {
        this.setAuthToken(payload.token);
      }
      this.manifoldOauthTokenChange.emit({ token: payload.token });
    }
  };

  @logger()
  render() {
    return (
      this.authType === 'oauth' &&
      !this.internalToken && (
        <manifold-oauth tick={this.tick} onReceiveManifoldToken={this.setInternalToken} />
      )
    );
  }
}
