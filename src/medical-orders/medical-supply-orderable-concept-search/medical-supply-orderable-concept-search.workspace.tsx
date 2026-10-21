import {
  ArrowLeftIcon,
  ResponsiveWrapper,
  Workspace2,
  launchWorkspace2,
  useConfig,
  useDebounce,
  useLayoutType,
  type Workspace2DefinitionProps,
} from '@openmrs/esm-framework';
import {
  type PatientWorkspace2DefinitionProps,
  type OrderBasketItem,
  type OrderBasketWindowProps,
  useOrderBasket,
  useOrderType,
} from '@openmrs/esm-patient-common-lib';
import React, { type ComponentProps, useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './medical-supply-orderable-concept-search.scss';
import { Button, Search } from '@carbon/react';
import OrderableConceptSearchResults from './search-results.component';
import { type ConfigObject } from '../../config-schema';
import { OrderForm } from '../medical-supply-order-form/medical-supply-order-form.component';
import { prepOrderPostData } from '../resources';
import { type MedicalSupplyOrderBasketItem } from '../types';

interface OrderableConceptSearchWorkspaceProps {
  order?: MedicalSupplyOrderBasketItem;
  orderTypeUuid: string;
}

export const careSettingUuid = '6f0c9a92-6f24-11e3-af88-005056821db0';

type DrugsOrOrders = Pick<OrderBasketItem, 'action'>;

export function ordersEqual(order1: DrugsOrOrders, order2: DrugsOrOrders) {
  return order1.action === order2.action;
}

const OrderableConceptSearchWorkspace: React.FC<
  PatientWorkspace2DefinitionProps<OrderableConceptSearchWorkspaceProps, OrderBasketWindowProps>
> = ({ workspaceProps, windowProps, groupProps, closeWorkspace }) => {
  const { order: initialOrder, orderTypeUuid } = workspaceProps;
  const { patient } = groupProps;
  const { t } = useTranslation();
  const isTablet = useLayoutType() === 'tablet';
  const { orders } = useOrderBasket<MedicalSupplyOrderBasketItem>(patient, orderTypeUuid, prepOrderPostData);
  const { orderType } = useOrderType(orderTypeUuid);
  const { orderTypes } = useConfig<ConfigObject>();

  const title = t('addOrderForOrderType', 'Add {{orderTypeDisplay}}', {
    orderTypeDisplay: orderType?.display.toLocaleLowerCase() ?? '',
  });

  const [currentOrder, setCurrentOrder] = useState<MedicalSupplyOrderBasketItem>(initialOrder);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const orderableConceptSets = useMemo(
    () => orderTypes.find((orderType) => orderType.orderTypeUuid === orderTypeUuid).orderableConceptSets,

    [orderTypeUuid, orderTypes],
  );

  const returnToOrderBasket = useCallback(
    async (options?: Parameters<Workspace2DefinitionProps['closeWorkspace']>[0]) => {
      const didClose = await closeWorkspace(options);
      if (didClose) {
        await launchWorkspace2('order-basket', null, windowProps, groupProps);
      }
      return didClose;
    },
    [closeWorkspace, windowProps, groupProps],
  );

  const openOrderForm = useCallback(
    (order: MedicalSupplyOrderBasketItem) => {
      const existingOrder = orders.find((prevOrder) => ordersEqual(prevOrder, order));
      if (existingOrder) {
        setCurrentOrder(existingOrder);
      } else {
        setCurrentOrder(order);
      }
    },
    [orders],
  );

  return (
    <Workspace2 title={title} hasUnsavedChanges={hasUnsavedChanges}>
      <div className={styles.workspaceWrapper}>
        {!isTablet && (
          <div className={styles.backButton}>
            <Button
              iconDescription="Return to order basket"
              kind="ghost"
              onClick={() => returnToOrderBasket()}
              renderIcon={(props: ComponentProps<typeof ArrowLeftIcon>) => <ArrowLeftIcon size={24} {...props} />}
              size="sm"
            >
              <span>{t('backToOrderBasket', 'Back to order basket')}</span>
            </Button>
          </div>
        )}
        {currentOrder ? (
          <OrderForm
            initialOrder={currentOrder}
            returnToOrderBasket={returnToOrderBasket}
            setHasUnsavedChanges={setHasUnsavedChanges}
            orderTypeUuid={orderTypeUuid}
            orderableConceptSets={orderableConceptSets}
            patient={patient}
          />
        ) : (
          <ConceptSearch
            openOrderForm={openOrderForm}
            returnToOrderBasket={returnToOrderBasket}
            orderableConceptSets={orderableConceptSets}
            orderTypeUuid={orderTypeUuid}
            patient={patient}
          />
        )}
      </div>
    </Workspace2>
  );
};

interface ConceptSearchProps {
  returnToOrderBasket: Workspace2DefinitionProps['closeWorkspace'];
  openOrderForm: (search: OrderBasketItem) => void;
  orderTypeUuid: string;
  orderableConceptSets: Array<string>;
  patient: fhir.Patient;
}

function ConceptSearch({
  returnToOrderBasket,
  orderTypeUuid,
  openOrderForm,
  orderableConceptSets,
  patient,
}: ConceptSearchProps) {
  const { t } = useTranslation();
  const { orderType } = useOrderType(orderTypeUuid);
  const isTablet = useLayoutType() === 'tablet';
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const searchInputRef = useRef(null);

  const focusAndClearSearchInput = () => {
    setSearchTerm('');
    searchInputRef.current?.focus();
  };

  const handleSearchTermChange: ComponentProps<typeof Search>['onChange'] = (event) =>
    setSearchTerm(event.target.value ?? '');

  return (
    <div className={styles.searchPopupContainer}>
      <ResponsiveWrapper>
        <Search
          autoFocus
          size="lg"
          placeholder={t('searchFieldOrder', 'Search for {{orderType}} order', {
            orderType: orderType?.display ?? '',
          })}
          labelText={t('searchFieldOrder', 'Search for {{orderType}} order', {
            orderType: orderType?.display ?? '',
          })}
          onChange={handleSearchTermChange}
          ref={searchInputRef}
          value={searchTerm}
        />
      </ResponsiveWrapper>
      <OrderableConceptSearchResults
        searchTerm={debouncedSearchTerm}
        openOrderForm={openOrderForm}
        focusAndClearSearchInput={focusAndClearSearchInput}
        returnToOrderBasket={returnToOrderBasket}
        orderTypeUuid={orderTypeUuid}
        cancelOrder={() => {}}
        orderableConceptSets={orderableConceptSets}
        patient={patient}
      />
      {isTablet && (
        <div className={styles.separatorContainer}>
          <p className={styles.separator}>{t('or', 'or')}</p>
          <Button iconDescription="Return to order basket" kind="ghost" onClick={() => returnToOrderBasket()}>
            {t('returnToOrderBasket', 'Return to order basket')}
          </Button>
        </div>
      )}
    </div>
  );
}

export default OrderableConceptSearchWorkspace;
