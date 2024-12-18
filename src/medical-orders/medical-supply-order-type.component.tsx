import React, { type ComponentProps, useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Tile } from '@carbon/react';
import classNames from 'classnames';
import styles from './medical-supply-order-panel.scss';
import {
  AddIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  closeWorkspace,
  type DefaultWorkspaceProps,
  useConfig,
  useLayoutType,
} from '@openmrs/esm-framework';
import { useTranslation } from 'react-i18next';
import { launchPatientWorkspace, useOrderBasket, useOrderType } from '@openmrs/esm-patient-common-lib';
import OrderBasketItemTile from './order-basket-item-tile.component';
import { prepOrderPostData } from './resources';
import { type ConfigObject } from '../config-schema';
import type { MedicalSupplyOrderBasketItem } from './types';

const MedicalSupplyOrderPanel: React.FC = () => {
  const { orderTypes } = useConfig<ConfigObject>();
  return (
    <>
      {orderTypes.map(({ orderTypeUuid, orderableConceptSets }) => (
        <MedicalSupplyOrderType
          key={orderTypeUuid}
          orderTypeUuid={orderTypeUuid}
          orderableConceptSets={orderableConceptSets}
        />
      ))}
    </>
  );
};

interface MedicalSupplyOrderTypeProps {
  orderTypeUuid: string;
  orderableConceptSets: Array<string>;
}

const MedicalSupplyOrderType: React.FC<MedicalSupplyOrderTypeProps> = ({ orderTypeUuid }) => {
  const { t } = useTranslation();
  const isTablet = useLayoutType() === 'tablet';
  const { orderType, isLoadingOrderType } = useOrderType(orderTypeUuid);

  const { orders, setOrders } = useOrderBasket<MedicalSupplyOrderBasketItem>(orderTypeUuid, prepOrderPostData);
  const [isExpanded, setIsExpanded] = useState(orders.length > 0);
  const {
    incompleteOrderBasketItems,
    newOrderBasketItems,
    renewedOrderBasketItems,
    revisedOrderBasketItems,
    discontinuedOrderBasketItems,
  } = useMemo(() => {
    const incompleteOrderBasketItems: Array<MedicalSupplyOrderBasketItem> = [];
    const newOrderBasketItems: Array<MedicalSupplyOrderBasketItem> = [];
    const renewedOrderBasketItems: Array<MedicalSupplyOrderBasketItem> = [];
    const revisedOrderBasketItems: Array<MedicalSupplyOrderBasketItem> = [];
    const discontinuedOrderBasketItems: Array<MedicalSupplyOrderBasketItem> = [];

    orders.forEach((order) => {
      if (order?.isOrderIncomplete) {
        incompleteOrderBasketItems.push(order);
      } else if (order.action === 'NEW') {
        newOrderBasketItems.push(order);
      } else if (order.action === 'RENEW') {
        renewedOrderBasketItems.push(order);
      } else if (order.action === 'REVISE') {
        revisedOrderBasketItems.push(order);
      } else if (order.action === 'DISCONTINUE') {
        discontinuedOrderBasketItems.push(order);
      }
    });

    return {
      incompleteOrderBasketItems,
      newOrderBasketItems,
      renewedOrderBasketItems,
      revisedOrderBasketItems,
      discontinuedOrderBasketItems,
    };
  }, [orders]);

  const openConceptSearch = () => {
    closeWorkspace('order-basket', {
      ignoreChanges: true,
      onWorkspaceClose: () =>
        launchPatientWorkspace('medical-supply-orderable-concept-workspace', {
          orderTypeUuid,
        }),
      closeWorkspaceGroup: false,
    });
  };

  const openOrderForm = (order: MedicalSupplyOrderBasketItem) => {
    closeWorkspace('order-basket', {
      ignoreChanges: true,
      onWorkspaceClose: () =>
        launchPatientWorkspace('medical-supply-orderable-concept-workspace', {
          order,
          orderTypeUuid,
        }),
      closeWorkspaceGroup: false,
    });
  };

  const removeOrder = useCallback(
    (order: MedicalSupplyOrderBasketItem) => {
      const newOrders = [...orders];
      newOrders.splice(orders.indexOf(order), 1);
      setOrders(newOrders);
    },
    [orders, setOrders],
  );

  useEffect(() => {
    setIsExpanded(orders.length > 0);
  }, [orders]);

  if (isLoadingOrderType) {
    return null;
  }

  return (
    <Tile
      className={classNames(isTablet ? styles.tabletTile : styles.desktopTile, { [styles.collapsedTile]: !isExpanded })}
    >
      <div className={styles.container}>
        <div className={styles.iconAndLabel}>
          {/* <RxIcon isTablet={isTablet} /> */}
          {/* TODO: Add Icon */}
          <h4 className={styles.heading}>{`${orderType?.display} (${orders.length})`}</h4>
        </div>
        <div className={styles.buttonContainer}>
          <Button
            className={styles.addButton}
            kind="ghost"
            renderIcon={(props: ComponentProps<typeof AddIcon>) => <AddIcon size={16} {...props} />}
            iconDescription="Add medication"
            onClick={openConceptSearch}
            size={isTablet ? 'md' : 'sm'}
          >
            {t('add', 'Add')}
          </Button>
          <Button
            className={styles.chevron}
            hasIconOnly
            kind="ghost"
            renderIcon={(props: ComponentProps<typeof ChevronUpIcon>) =>
              isExpanded ? <ChevronUpIcon size={16} {...props} /> : <ChevronDownIcon size={16} {...props} />
            }
            iconDescription="View"
            disabled={orders.length === 0}
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {t('add', 'Add')}
          </Button>
        </div>
      </div>
      {isExpanded && (
        <>
          {incompleteOrderBasketItems.length > 0 && (
            <>
              {incompleteOrderBasketItems.map((order, index) => (
                <OrderBasketItemTile
                  key={index}
                  orderBasketItem={order}
                  onItemClick={() => openOrderForm(order)}
                  onRemoveClick={() => removeOrder(order)}
                />
              ))}
            </>
          )}
          {newOrderBasketItems.length > 0 && (
            <>
              {newOrderBasketItems.map((order, index) => (
                <OrderBasketItemTile
                  key={index}
                  orderBasketItem={order}
                  onItemClick={() => openOrderForm(order)}
                  onRemoveClick={() => removeOrder(order)}
                />
              ))}
            </>
          )}

          {renewedOrderBasketItems.length > 0 && (
            <>
              {renewedOrderBasketItems.map((item, index) => (
                <OrderBasketItemTile
                  key={index}
                  orderBasketItem={item}
                  onItemClick={() => openOrderForm(item)}
                  onRemoveClick={() => removeOrder(item)}
                />
              ))}
            </>
          )}

          {revisedOrderBasketItems.length > 0 && (
            <>
              {revisedOrderBasketItems.map((item, index) => (
                <OrderBasketItemTile
                  key={index}
                  orderBasketItem={item}
                  onItemClick={() => openOrderForm(item)}
                  onRemoveClick={() => removeOrder(item)}
                />
              ))}
            </>
          )}

          {discontinuedOrderBasketItems.length > 0 && (
            <>
              {discontinuedOrderBasketItems.map((item, index) => (
                <OrderBasketItemTile
                  key={index}
                  orderBasketItem={item}
                  onItemClick={() => openOrderForm(item)}
                  onRemoveClick={() => removeOrder(item)}
                />
              ))}
            </>
          )}
        </>
      )}
    </Tile>
  );
};

export default MedicalSupplyOrderPanel;
