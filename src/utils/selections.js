import { RAYDIANT_APP_LS_RETAIL_BASE_URL, DETAIL_OPTIONS } from '../constants';

import * as PropTypes from 'raydiant-kit/prop-types';

const isPathEqual = (path1, path2) => {
  if (path1.length !== path2.length) return false;
  return path1.every((p, i) => p === path2[i]);
};

export const getInputStateAtPath = (propertyPath, builderState) => {
  const input = ((builderState && builderState.inputs) || []).find((i) => isPathEqual(propertyPath, i.path));
  return input && input.state;
};

class Selection {
  getSelectedIds(values) {
    return values[this.propId];
  }

  getFocusedOption(builderState) {
    const parentState = getInputStateAtPath([this.propId], builderState);
    return parentState ? parentState.selectedOption : undefined;
  }
}

export class CategorySelection extends Selection {
  constructor(parent, hidePrice = false) {
    super();
    this.parent = parent;
    this.hidePrice = hidePrice;
  }

  get propId() {
    return this.parent ? `category-${this.parent.id}-subcategory-ids` : 'categoryIds';
  }

  get prop() {
    const label = this.parent ? `select ${this.parent.name} sub-categories` : 'select categories';
    return PropTypes.selection(label)
      .multiple()
      .searchable()
      .selectable()
      .sortable([
        { label: 'Default', by: 'default' },
        { label: 'Name', by: 'label' },
      ])
      .optionsUrl(
        `${RAYDIANT_APP_LS_RETAIL_BASE_URL}/categoryOptions?` +
          `auth_key={{authKey}}&parent_id=${this.parent ? this.parent.id : 0}`
      );
  }

  getProps(values, builderState) {
    const focusedOption = this.getFocusedOption(builderState);
    if (!focusedOption || !focusedOption.value) {
      return { [this.propId]: this.prop };
    }

    const selectedIds = this.getSelectedIds(values) || [];
    const detailDisabled = !selectedIds.includes(focusedOption.value);
    const category = { id: focusedOption.value, name: focusedOption.label };
    const detailSelection = new CategoryDetailSelection(category, this.hidePrice, detailDisabled);
    return { [this.propId]: this.prop, ...detailSelection.getProps(values, builderState) };
  }
}

export class CategoryDetailSelection extends Selection {
  constructor(category, hidePrice, disabled) {
    super();
    this.category = category;
    this.hidePrice = hidePrice;
    this.disabled = disabled;
  }

  get propId() {
    return `category-${this.category.id}-details`;
  }

  get prop() {
    return PropTypes.selection(`select ${this.category.name} details`)
      .multiple()
      .optionsUrl(
        `${RAYDIANT_APP_LS_RETAIL_BASE_URL}/category/${this.category.id}/detailOptions?` +
          `auth_key={{authKey}}&hide_price=${this.hidePrice}`
      )
      .disable(this.disabled);
  }

  getProps(values, builderState) {
    const selectedDetails = this.getSelectedIds(values) || [];
    const hideChildPrice = this.hidePrice || !selectedDetails.includes(DETAIL_OPTIONS.PRICING);

    let props = { [this.propId]: this.prop };
    if (this.disabled) return props;

    if (selectedDetails.includes(DETAIL_OPTIONS.SUBCATEGORIES)) {
      const subcategorySelection = new CategorySelection(this.category, hideChildPrice);
      props = { ...props, ...subcategorySelection.getProps(values, builderState) };
    }

    if (selectedDetails.includes(DETAIL_OPTIONS.ITEMS)) {
      const itemSelection = new ItemSelection(this.category, hideChildPrice);
      props = { ...props, ...itemSelection.getProps(values, builderState) };
    }

    return props;
  }
}

export class ItemSelection extends Selection {
  constructor(category, hidePrice) {
    super();
    this.category = category;
    this.hidePrice = hidePrice;
  }

  get propId() {
    return `category-${this.category.id}-item-ids`;
  }

  get prop() {
    const label = `select ${this.category.name} items`;
    return PropTypes.selection(label)
      .multiple()
      .searchable()
      .selectable()
      .sortable([
        { label: 'Default', by: 'default' },
        { label: 'Name', by: 'label' },
      ])
      .optionsUrl(
        `${RAYDIANT_APP_LS_RETAIL_BASE_URL}/itemOptions?` +
          `auth_key={{authKey}}&category_id=${this.category ? this.category.id : 0}`
      );
  }

  getProps(values, builderState) {
    const focusedOption = this.getFocusedOption(builderState);
    if (!focusedOption || !focusedOption.value) {
      return { [this.propId]: this.prop };
    }

    const selectedIds = this.getSelectedIds(values) || [];
    const detailDisabled = !selectedIds.includes(focusedOption.value);
    const item = { id: focusedOption.value, name: focusedOption.label };
    const detailSelection = new ItemDetailSelection(item, this.hidePrice, detailDisabled);
    return { [this.propId]: this.prop, ...detailSelection.getProps(values, builderState) };
  }
}

export class ItemDetailSelection extends Selection {
  constructor(item, hidePrice = false, disabled = false) {
    super();
    this.item = item;
    this.hidePrice = hidePrice;
    this.disabled = disabled;
  }

  get propId() {
    return `item-${this.item.id}-details`;
  }

  get prop() {
    return PropTypes.selection(`select ${this.item.name} details`)
      .multiple()
      .optionsUrl(
        `${RAYDIANT_APP_LS_RETAIL_BASE_URL}/item/${this.item.id}/detailOptions?` +
          `auth_key={{authKey}}&hide_price=${this.hidePrice}&location_id={{locationId}}`
      )
      .disable(this.disabled);
  }

  getProps(values) {
    const selectedDetails = this.getSelectedIds(values) || [];
    const hideModifierPrice = this.hidePrice || !selectedDetails.includes(DETAIL_OPTIONS.PRICE);

    let props = { [this.propId]: this.prop };
    if (this.disabled) return props;

    if (selectedDetails.includes(DETAIL_OPTIONS.MODIFIERS)) {
      const modifierSelection = new ModifierSelection(this.item, hideModifierPrice);
      props = { ...props, [modifierSelection.propId]: modifierSelection.prop };
    }

    return props;
  }
}

export class ModifierSelection extends Selection {
  constructor(item, hidePrice) {
    super();
    this.item = item;
    this.hidePrice = hidePrice;
  }

  get propId() {
    return `item-${this.item.id}-modifier-ids`;
  }

  get prop() {
    return PropTypes.selection(`select ${this.item.name} modifiers`)
      .multiple()
      .optionsUrl(`${RAYDIANT_APP_LS_RETAIL_BASE_URL}/item/${this.item.id}/modifierOptions?auth_key={{authKey}}`);
  }
}
