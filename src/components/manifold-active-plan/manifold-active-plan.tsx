import { h, Component, State, Prop, Watch } from '@stencil/core';
import logger, { loadMark } from '../../utils/logger';
import { Product, PlanEdge, Resource } from '../../types/graphql';
import { formatGatewayFeatures } from '../../utils/configuredFeatures';

@Component({
  tag: 'manifold-active-plan',
  styleUrl: 'manifold-active-plan.css',
  shadow: true,
})
export class ManifoldActivePlan {
  @Prop() isExistingResource?: boolean;
  @Prop() plans?: PlanEdge[];
  @Prop() product?: Product;
  @Prop() regions?: string[];
  @Prop() selectedResource?: Resource;
  @State() selectedPlanId: string;
  @Watch('plans') plansChange(newPlans: PlanEdge[]) {
    if (this.selectedResource && this.selectedResource.plan && this.selectedResource.plan.id) {
      this.selectPlan(this.selectedResource.plan.id);
    } else if (newPlans && newPlans.length > 0) {
      this.selectPlan(newPlans[0].node.id);
    }
  }
  @Watch('selectedResource') resourceChange(newResource: Resource) {
    if (newResource && newResource.plan && newResource.plan.id) {
      this.selectPlan(newResource.plan.id);
    }
  }

  selectPlan = (planId: string) => {
    this.selectedPlanId = planId;
  };

  get selectedPlan() {
    if (!this.plans || !this.plans.length) {
      return undefined;
    }

    // return selectedPlanID plan, or the first plan if that fails
    const plan = this.plans.find(({ node: { id } }) => id === this.selectedPlanId);
    return (plan && plan.node) || this.plans[0].node;
  }

  @loadMark()
  componentWillLoad() {}

  @logger()
  render() {
    const resourceRegion =
      (this.selectedResource && this.selectedResource.region && this.selectedResource.region.id) ||
      undefined;

    return [
      <manifold-plan-menu
        plans={this.plans}
        selectedPlanId={this.selectedPlanId}
        selectPlan={this.selectPlan}
      />,
      <manifold-plan-details
        isExistingResource={this.isExistingResource}
        configuredFeatures={formatGatewayFeatures(this.selectedResource?.configuredFeatures?.edges)}
        plan={this.selectedPlan}
        product={this.product}
        regions={this.regions}
        resourceRegion={resourceRegion}
        scrollLocked={true}
        region={this.selectedResource && this.selectedResource.region}
      >
        <manifold-forward-slot slot="cta">
          <slot name="cta" />
        </manifold-forward-slot>
      </manifold-plan-details>,
    ];
  }
}
