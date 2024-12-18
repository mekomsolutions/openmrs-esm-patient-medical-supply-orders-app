/**
 * This is the entrypoint file of the application. It communicates the
 * important features of this microfrontend to the app shell. It
 * connects the app shell to the React application(s) that make up this
 * microfrontend.
 */
import { getAsyncLifecycle, defineConfigSchema } from '@openmrs/esm-framework';
import { configSchema } from './config-schema';
import { moduleName } from './constants';

const options = {
  featureName: 'patient-medical-supply-order',
  moduleName,
};

export const importTranslation = require.context('../translations', false, /.json$/, 'lazy');

export function startupApp() {
  defineConfigSchema(moduleName, configSchema);
}

export const medicalSupplyOrderPanel = getAsyncLifecycle(
  () => import('./medical-orders/medical-supply-order-type.component'),
  options,
);

// t('searchMedicalSupplyOrderables', 'Search medical supply orderables')
export const searchMedicalSupplyOrderables = getAsyncLifecycle(
  () =>
    import(
      './medical-orders/medical-supply-orderable-concept-search/medical-supply-orderable-concept-search.workspace'
    ),
  options,
);

export const modifyMedicalSupplyOrderMenuItem = getAsyncLifecycle(
  () => import('./medical-orders/action-menu-items/modify-medical-supply-order-menu-item.extension'),
  options,
);

export const medicalSupplyOrderDetailTable = getAsyncLifecycle(
  () => import('./medical-orders/medical-supply-detail-table/medical-supply-detail.extension'),
  options,
);
