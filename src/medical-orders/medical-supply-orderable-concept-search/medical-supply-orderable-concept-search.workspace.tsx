import {
  ArrowLeftIcon,
  getDefaultsFromConfigSchema,
  ResponsiveWrapper,
  useConfig,
  useDebounce,
  useLayoutType,
  type DefaultWorkspaceProps,
} from '@openmrs/esm-framework';
import {
  launchPatientWorkspace,
  type OrderBasketItem,
  useOrderBasket,
  useOrderType,
  usePatientChartStore,
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

interface OrderableConceptSearchWorkspaceProps extends DefaultWorkspaceProps {
  order: MedicalSupplyOrderBasketItem;
  orderTypeUuid: string;
  orderableConceptClasses: Array<string>;
  orderableConceptSets: Array<string>;
}

export const careSettingUuid = '6f0c9a92-6f24-11e3-af88-005056821db0';

type DrugsOrOrders = Pick<OrderBasketItem, 'action'>;

export function ordersEqual(order1: DrugsOrOrders, order2: DrugsOrOrders) {
  return order1.action === order2.action;
}

const OrderableConceptSearchWorkspace: React.FC<OrderableConceptSearchWorkspaceProps> = ({
  order: initialOrder,
  orderTypeUuid,
  closeWorkspace,
  closeWorkspaceWithSavedChanges,
  promptBeforeClosing,
}) => {
  const { t } = useTranslation();
  const isTablet = useLayoutType() === 'tablet';
  const { orders } = useOrderBasket<MedicalSupplyOrderBasketItem>(orderTypeUuid, prepOrderPostData);
  const { patientUuid } = usePatientChartStore();
  const { orderType } = useOrderType(orderTypeUuid);
  const { orderTypes } = useConfig<ConfigObject>();

  const [currentOrder, setCurrentOrder] = useState<MedicalSupplyOrderBasketItem>(initialOrder);

  const { orderableConceptClasses, orderableConceptSets } = useMemo(
    () => orderTypes.find((orderType) => orderType.orderTypeUuid === orderTypeUuid),

    [orderTypeUuid, orderTypes],
  );

  const conceptClasses = useMemo(
    () =>
      orderableConceptClasses?.length
        ? orderableConceptClasses
        : (orderType?.conceptClasses.map(({ uuid }) => uuid) ?? []),
    [orderType?.conceptClasses, orderableConceptClasses],
  );

  const cancelDrugOrder = useCallback(() => {
    closeWorkspace({
      onWorkspaceClose: () => launchPatientWorkspace('order-basket'),
    });
  }, [closeWorkspace]);

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
    <div className={styles.workspaceWrapper}>
      {!isTablet && (
        <div className={styles.backButton}>
          <Button
            iconDescription="Return to order basket"
            kind="ghost"
            onClick={cancelDrugOrder}
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
          closeWorkspace={closeWorkspace}
          closeWorkspaceWithSavedChanges={closeWorkspaceWithSavedChanges}
          promptBeforeClosing={promptBeforeClosing}
          orderTypeUuid={orderTypeUuid}
          orderableConceptSets={orderableConceptSets}
          patientUuid={patientUuid}
          setTitle={() => {}}
        />
      ) : (
        <ConceptSearch
          openOrderForm={openOrderForm}
          closeWorkspace={closeWorkspace}
          orderableConceptClasses={conceptClasses}
          orderableConceptSets={orderableConceptSets}
          orderTypeUuid={orderTypeUuid}
        />
      )}
    </div>
  );
};

interface ConceptSearchProps {
  closeWorkspace: DefaultWorkspaceProps['closeWorkspace'];
  openOrderForm: (search: OrderBasketItem) => void;
  orderTypeUuid: string;
  orderableConceptClasses: Array<string>;
  orderableConceptSets: Array<string>;
}

function ConceptSearch({
  closeWorkspace,
  orderTypeUuid,
  openOrderForm,
  orderableConceptClasses,
  orderableConceptSets,
}: ConceptSearchProps) {
  const { t } = useTranslation();
  const { orderType } = useOrderType(orderTypeUuid);
  const isTablet = useLayoutType() === 'tablet';
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const searchInputRef = useRef(null);

  const cancelDrugOrder = useCallback(() => {
    closeWorkspace({
      onWorkspaceClose: () => launchPatientWorkspace('order-basket'),
    });
  }, [closeWorkspace]);

  const focusAndClearSearchInput = () => {
    setSearchTerm('');
    searchInputRef.current?.focus();
  };

  const handleSearchTermChange = (event: React.ChangeEvent<HTMLInputElement>) =>
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
        closeWorkspace={closeWorkspace}
        orderTypeUuid={orderTypeUuid}
        cancelOrder={() => {}}
        orderableConceptClasses={orderableConceptClasses}
        orderableConceptSets={orderableConceptSets}
      />
      {isTablet && (
        <div className={styles.separatorContainer}>
          <p className={styles.separator}>{t('or', 'or')}</p>
          <Button iconDescription="Return to order basket" kind="ghost" onClick={cancelDrugOrder}>
            {t('returnToOrderBasket', 'Return to order basket')}
          </Button>
        </div>
      )}
    </div>
  );
}

export default OrderableConceptSearchWorkspace;