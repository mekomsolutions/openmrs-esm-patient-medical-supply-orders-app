import React, { useMemo } from 'react';
import styles from './medical-supply-detail.scss';
import { type Order } from '@openmrs/esm-patient-common-lib';
import { useTranslation } from 'react-i18next';
import { useLayoutType } from '@openmrs/esm-framework';

interface TestOrderProps {
  orderItem: Order;
}

const MedicalSupplyOrderDetailTable: React.FC<TestOrderProps> = ({ orderItem }) => {
  const { t } = useTranslation();
  return (
    <div className={styles.order}>
      <div>
        <span className={styles.label01}>{t('quantity', 'Quantity')}</span> {orderItem.quantity ?? 0}{' '}
        {orderItem.quantityUnits?.display}
      </div>
      {orderItem.instructions && (
        <div>
          <span className={styles.label01}>{t('instructions', 'Instructions')}</span> {orderItem.instructions}
        </div>
      )}
    </div>
  );
};

export default MedicalSupplyOrderDetailTable;
