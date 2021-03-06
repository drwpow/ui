import { h, Component, Element, Prop, State } from '@stencil/core';

import { GraphqlFetch } from '../../utils/graphqlFetch';
import { connection } from '../../global/app';
import logger, { loadMark } from '../../utils/logger';
import {
  Query,
  ProductEdge,
  ProductState,
  ProductCredentialsSupportType,
} from '../../types/graphql';
import fetchAllPages from '../../utils/fetchAllPages';
import skeletonProducts from '../../data/marketplace';
import { Catalog } from '../../types/catalog';
import productQuery from './products.graphql';

function transformSkeleton(skel: Catalog.Product): ProductEdge {
  return {
    cursor: skel.id,
    node: {
      id: skel.id,
      displayName: skel.body.name,
      documentationUrl: skel.body.documentation_url,
      label: skel.body.label,
      listing: { beta: false, featured: false, new: false, comingSoon: false },
      logoUrl: skel.body.logo_url,
      tagline: skel.body.tagline,
      settings: {
        ssoSupported: true,
        credentialsSupport: ProductCredentialsSupportType.Single,
      },
      setupStepsHtml: '',
      state: ProductState.Available,
      supportEmail: skel.body.support_email,
      tags: skel.body.tags || [],
      termsUrl: '',
      valueProps: [],
      valuePropsHtml: '',
      categories: skel.body.tags
        ? skel.body.tags.map(t => ({
            displayName: t,
            id: '',
            label: t,
            products: {
              edges: [],
              pageInfo: {
                hasNextPage: false,
                hasPreviousPage: false,
              },
            },
          }))
        : [],
    },
  };
}

@Component({ tag: 'manifold-marketplace' })
export class ManifoldMarketplace {
  @Element() el: HTMLElement;
  /** _(hidden)_ */
  @Prop() graphqlFetch?: GraphqlFetch = connection.graphqlFetch;
  /** Comma-separated list of featured products (labels) */
  @Prop() featured?: string;
  /** Hide categories & side menu? */
  @Prop() hideCategories?: boolean = false;
  /** Hide search? */
  @Prop() hideSearch?: boolean = false;
  /** Hide template cards? */
  @Prop() hideTemplates?: boolean = false;
  /** Should the JS event still fire, even if product-link-format is passed?  */
  @Prop() preserveEvent?: boolean = false;
  /** Product link structure, with `:product` placeholder */
  @Prop() productLinkFormat?: string;
  /** Comma-separated list of shown products (labels) */
  @Prop() products?: string;
  /** Template format structure, with `:product` placeholder */
  @Prop() templateLinkFormat?: string;
  @Prop() hideUntilReady?: boolean = false;
  @State() parsedFeatured: string[] = [];
  @State() parsedProducts: string[] = [];
  @State() services: ProductEdge[];
  @State() isLoading: boolean = false;

  @loadMark()
  componentWillLoad() {
    this.parseProps();
    const call = this.fetchProducts();

    if (this.hideUntilReady) {
      return call;
    }

    return Promise.resolve();
  }

  async fetchProducts() {
    this.isLoading = true;
    this.services = await fetchAllPages({
      query: productQuery,
      nextPage: { first: 50, after: '' },
      getConnection: (q: Query) => q.products,
      graphqlFetch: this.graphqlFetch,
      element: this.el,
    });
    this.isLoading = false;
  }

  private parse(list: string): string[] {
    return list.split(',').map(item => item.trim());
  }

  private parseProps() {
    if (typeof this.featured === 'string') {
      this.parsedFeatured = this.parse(this.featured);
    }
    if (typeof this.products === 'string') {
      this.parsedProducts = this.parse(this.products);
    }
  }

  @logger()
  render() {
    const accurateSkeletonCount =
      this.parsedProducts.length > 0 && this.parsedProducts.length < skeletonProducts.length
        ? skeletonProducts.slice(0, this.parsedProducts.length)
        : skeletonProducts;
    const freeProducts = this.services
      ? this.services.filter(
          ({ node: { plans } }) =>
            plans && plans.edges.findIndex(({ node: { free } }) => !!free) !== -1
        )
      : [];

    return (
      <manifold-marketplace-grid
        featured={this.parsedFeatured}
        freeProducts={freeProducts.map(({ node: { label } }) => label)}
        hideCategories={this.hideCategories}
        hideSearch={this.hideSearch}
        hideTemplates={this.hideTemplates}
        preserveEvent={this.preserveEvent}
        productLinkFormat={this.productLinkFormat}
        products={this.parsedProducts}
        skeleton={this.isLoading}
        services={this.isLoading ? accurateSkeletonCount.map(transformSkeleton) : this.services}
        templateLinkFormat={this.templateLinkFormat}
      >
        <manifold-forward-slot slot="sidebar">
          <slot name="sidebar" />
        </manifold-forward-slot>
      </manifold-marketplace-grid>
    );
  }
}
