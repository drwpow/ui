import { h, Component, Prop, State, Event, EventEmitter, Watch, Element } from '@stencil/core';

import { Option } from '../../types/Select';
import { Product, Plan, Region, RegionEdge, ConfiguredFeatureInput } from '../../types/graphql';
import logger, { loadMark } from '../../utils/logger';
import { configurableFeatureDefaults } from '../../utils/plan';
import FixedFeature from './components/FixedFeature';
import MeteredFeature from './components/MeteredFeature';
import ConfigurableFeature from './components/ConfigurableFeature';
import { Gateway } from '../../types/gateway';
import { formatConfiguredFeatures } from '../../utils/configuredFeatures';

interface EventDetail {
  planId: string;
  planLabel: string;
  planName: string;
  productId?: string;
  productLabel: string | undefined;
  regionId?: string;
  regionName?: string;
  freePlan: boolean;
  configuredFeatures?: ConfiguredFeatureInput[];
}

@Component({
  tag: 'manifold-plan-details',
  styleUrl: 'manifold-plan-details.css',
  shadow: true,
})
export class ManifoldPlanDetails {
  @Element() el: HTMLElement;
  @Prop() readOnly?: boolean = false;
  @Prop() isExistingResource?: boolean = false;
  @Prop() scrollLocked?: boolean = false;
  @Prop() plan?: Plan;
  @Prop() product?: Product;
  @Prop() region?: Region;
  @Prop() regions?: string[];
  @Prop() resourceRegion?: string;
  @Prop() configuredFeatures?: Gateway.FeatureMap;
  @State() features: Gateway.FeatureMap = {};
  @State() regionId?: string;
  @Event({ eventName: 'manifold-planSelector-change', bubbles: true }) planUpdate: EventEmitter;
  @Event({ eventName: 'manifold-planSelector-load', bubbles: true }) planLoad: EventEmitter;
  @Watch('plan') planChange(newPlan: Plan, oldPlan: Plan | undefined) {
    const defaultRegion = this.getDefaultRegion(newPlan, this.regionId, this.regions);
    const detail: EventDetail = {
      planId: newPlan.id,
      planLabel: newPlan.label,
      planName: newPlan.displayName,
      productId: this.product && this.product.id,
      productLabel: this.product && this.product.label,
      regionId: defaultRegion && defaultRegion.id,
      regionName: defaultRegion && defaultRegion.displayName,
      freePlan: newPlan.free,
      configuredFeatures: formatConfiguredFeatures(this.features),
    };

    if (!oldPlan) {
      // load event if first time
      this.planLoad.emit(detail);
    } else {
      // change event if updating
      this.planUpdate.emit(detail);
    }

    // update features
    this.resetFeatures(newPlan, this.configuredFeatures);
  }
  @Watch('resourceRegion') resourceRegionChange(newRegion: string) {
    this.regionId = newRegion;
  }

  @loadMark()
  componentWillLoad() {
    if (this.resourceRegion) {
      this.regionId = this.resourceRegion;
    }

    if (this.plan) {
      // load event
      const defaultRegion = this.getDefaultRegion(this.plan, this.regionId, this.regions);
      const detail: EventDetail = {
        planId: this.plan.id,
        planLabel: this.plan.label,
        planName: this.plan.displayName,
        productId: this.product && this.product.id,
        productLabel: this.product && this.product.label,
        regionId: defaultRegion && defaultRegion.id,
        regionName: defaultRegion && defaultRegion.displayName,
        freePlan: this.plan.free,
        configuredFeatures: formatConfiguredFeatures(this.features),
      };
      this.planLoad.emit(detail);

      // reset features
      this.resetFeatures(this.plan, this.configuredFeatures);
    }
  }

  handleChangeValue = ({ detail: { name, value } }: CustomEvent) => {
    const features = { ...this.features, [name]: value };
    this.features = features; // User-selected features
    if (this.plan && this.product) {
      const defaultRegion = this.getDefaultRegion(this.plan, this.regionId, this.regions);
      const detail: EventDetail = {
        planId: this.plan.id,
        planLabel: this.plan.label,
        planName: this.plan.displayName,
        productId: this.product.id,
        productLabel: this.product.label,
        regionId: defaultRegion && defaultRegion.id,
        regionName: defaultRegion && defaultRegion.displayName,
        freePlan: this.plan.free,
        configuredFeatures: formatConfiguredFeatures(features),
      };
      this.planUpdate.emit(detail);
    }
  };

  handleChangeRegion = (e: CustomEvent) => {
    if (!e.detail || !e.detail.value) {
      return;
    }
    this.regionId = e.detail.value;
    if (this.plan && this.product) {
      const defaultRegion = this.getDefaultRegion(this.plan, e.detail.value, this.regions);
      const detail: EventDetail = {
        planId: this.plan.id,
        planName: this.plan.displayName,
        planLabel: this.plan.label,
        productId: this.product.id,
        productLabel: this.product.label,
        regionId: e.detail.value,
        regionName: defaultRegion && defaultRegion.displayName,
        freePlan: this.plan.free,
        configuredFeatures: formatConfiguredFeatures(this.features),
      };
      this.planUpdate.emit(detail);
    }
  };

  filterRegions(regions: RegionEdge[], allowedRegions: string[] | undefined = this.regions) {
    if (Array.isArray(allowedRegions) && allowedRegions.length) {
      return regions
        .filter(({ node: { id } }) => allowedRegions.includes(id))
        .map(({ node }) => node);
    }
    return regions.map(({ node }) => node);
  }

  getDefaultRegion(plan: Plan, regionId?: string, allowedRegions?: string[]) {
    if (!plan.regions) {
      return undefined;
    }

    const regions = this.filterRegions(plan.regions.edges, allowedRegions);
    const [firstRegion] = regions;
    if (regionId) {
      const region = regions.find(({ id }) => id === regionId);
      return region || firstRegion;
    }
    return firstRegion;
  }

  get regionOptions() {
    if (!this.plan || !this.plan.regions) {
      return undefined;
    }

    let regions: Region[] = [];

    const resourceRegion = this.plan.regions.edges.find(
      ({ node }) => node.id === this.resourceRegion
    );
    if (resourceRegion) {
      regions = [resourceRegion.node];
    } else {
      regions = this.filterRegions(this.plan.regions.edges);
    }

    // hide if only one
    if (regions.length < 2) {
      return undefined;
    }

    const options: Option[] = regions.map(({ id, displayName }) => ({
      label: displayName,
      value: id,
    }));

    return options;
  }

  resetFeatures = (plan: Plan, configuredFeatures: Gateway.FeatureMap = {}) => {
    if (plan.configurableFeatures) {
      if (this.readOnly || this.isExistingResource) {
        this.features = {
          ...configurableFeatureDefaults(plan.configurableFeatures.edges),
          ...configuredFeatures,
        };
      } else {
        this.features = configurableFeatureDefaults(plan.configurableFeatures.edges);
      }
    } else {
      this.features = {};
    }
  };

  @logger()
  render() {
    if (this.plan && this.product) {
      return (
        <section
          class="wrapper"
          data-scroll-locked={this.scrollLocked}
          itemscope
          itemtype="https://schema.org/IndividualProduct"
        >
          <div class="card">
            <header class="header">
              <div class="logo">
                <img src={this.product.logoUrl} alt={this.product.displayName} itemprop="logo" />
              </div>
              <div>
                <h1 class="plan-name" itemprop="name">
                  {this.plan.displayName}
                </h1>
                <h2 class="product-name" itemprop="brand">
                  {this.product.displayName}
                </h2>
              </div>
            </header>
            <dl class="features">
              {this.plan.fixedFeatures &&
                this.plan.fixedFeatures.edges.map(fixedFeature => (
                  <FixedFeature fixedFeature={fixedFeature} />
                ))}
              {this.plan.meteredFeatures &&
                this.plan.meteredFeatures.edges.map(meteredFeature => (
                  <MeteredFeature meteredFeature={meteredFeature} />
                ))}
              {this.plan.configurableFeatures &&
                this.plan.configurableFeatures.edges.map(configurableFeature => (
                  <ConfigurableFeature
                    onChange={this.handleChangeValue}
                    configurableFeature={configurableFeature}
                    value={this.features[configurableFeature.node.label]}
                    readOnly={this.readOnly}
                    isExistingResource={this.isExistingResource}
                  />
                ))}
            </dl>
            {(this.regionOptions || this.region) && (
              <div class="region">
                <label
                  class="region-label"
                  htmlFor="manifold-region-selector"
                  id="manifold-region-selector-label"
                >
                  Region
                </label>
                {!this.isExistingResource && this.regionOptions && (
                  <manifold-select
                    aria-label="plan region selection"
                    defaultValue={this.regionId}
                    id="manifold-region-selector"
                    name="manifold-region-selector"
                    onUpdateValue={this.handleChangeRegion}
                    options={this.regionOptions}
                  />
                )}
                {this.isExistingResource && this.region && this.region.displayName}
              </div>
            )}

            <footer class="footer">
              <manifold-plan-cost plan={this.plan} selectedFeatures={this.features} />
              <slot name="cta" />
            </footer>
          </div>
        </section>
      );
    }
    // 💀
    return (
      <section class="wrapper" data-scroll-locked={this.scrollLocked}>
        <div class="card">
          <header class="header">
            <div class="logo">
              <manifold-skeleton-img />
            </div>
            <div>
              <h1 class="plan-name" itemprop="name">
                <manifold-skeleton-text>Plan name</manifold-skeleton-text>
              </h1>
              <h2 class="product-name" itemprop="brand">
                <manifold-skeleton-text>Product name</manifold-skeleton-text>
              </h2>
            </div>
          </header>
          <br />
          <manifold-skeleton-text>Features features features features</manifold-skeleton-text>
          <footer class="footer">
            <manifold-skeleton-text>Free</manifold-skeleton-text>
          </footer>
        </div>
      </section>
    );
  }
}
