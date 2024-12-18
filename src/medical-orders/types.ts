import type { OpenmrsResource } from '@openmrs/esm-framework';
import type { OrderBasketItem } from '@openmrs/esm-patient-common-lib';

export interface MedicalSupplyOrderBasketItem extends OrderBasketItem {
  quantity?: number;
  quantityUnits?: OpenmrsResource;
}
