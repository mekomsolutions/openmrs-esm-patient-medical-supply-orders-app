import React, { useCallback, useEffect, useMemo, useState } from 'react';
import classNames from 'classnames';
import {
  type DefaultPatientWorkspaceProps,
  launchPatientWorkspace,
  useOrderBasket,
  useOrderType,
  priorityOptions,
} from '@openmrs/esm-patient-common-lib';
import { translateFrom, useLayoutType, useSession, useConfig, ExtensionSlot } from '@openmrs/esm-framework';
import {
  Button,
  ButtonSet,
  Column,
  ComboBox,
  Form,
  Grid,
  InlineNotification,
  Layer,
  NumberInput,
  SelectSkeleton,
  TextArea,
  TextInput,
} from '@carbon/react';
import { useTranslation } from 'react-i18next';
import { Controller, type FieldErrors, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import styles from './medical-supply-order-form.scss';
import { type Concept, ordersEqual, prepOrderPostData, useQuantityUnits } from '../resources';
import { moduleName } from '../../constants';
import { type MedicalSupplyOrderBasketItem } from '../types';

export interface OrderFormProps extends DefaultPatientWorkspaceProps {
  initialOrder: MedicalSupplyOrderBasketItem;
  orderTypeUuid: string;
  orderableConceptSets: Array<string>;
}

// Designs:
//   https://app.zeplin.io/project/60d5947dd636aebbd63dce4c/screen/640b06c440ee3f7af8747620
//   https://app.zeplin.io/project/60d5947dd636aebbd63dce4c/screen/640b06d286e0aa7b0316db4a
export function OrderForm({
  initialOrder,
  closeWorkspace,
  closeWorkspaceWithSavedChanges,
  promptBeforeClosing,
  orderTypeUuid,
}: OrderFormProps) {
  const { t } = useTranslation();
  const isTablet = useLayoutType() === 'tablet';
  const session = useSession();
  const isEditing = useMemo(() => initialOrder && initialOrder.action === 'REVISE', [initialOrder]);
  const { orders, setOrders } = useOrderBasket<MedicalSupplyOrderBasketItem>(orderTypeUuid, prepOrderPostData);
  const [showErrorNotification, setShowErrorNotification] = useState(false);
  const { orderType } = useOrderType(orderTypeUuid);
  const { concepts, isLoadingQuantityUnits, errorFetchingQuantityUnits } = useQuantityUnits();

  const OrderFormSchema = useMemo(
    () =>
      z.object({
        instructions: z.string().optional(),
        urgency: z.string().refine((value) => value !== '', {
          message: t('addLabOrderPriorityRequired', 'Priority is required'),
        }),
        quantity: z.number({
          required_error: t('quantityRequired', 'Quantity is required'),
          invalid_type_error: t('quantityRequired', 'Quantity is required'),
        }),
        quantityUnits: z.object(
          {
            display: z.string(),
            uuid: z.string(),
          },
          {
            required_error: t('quantityUnitsRequired', 'Quantity units is required'),
            invalid_type_error: t('quantityUnitsRequired', 'Quantity units is required'),
          },
        ),
        accessionNumber: z.string().optional(),
        concept: z.object(
          { display: z.string(), uuid: z.string() },
          {
            required_error: t('addOrderableConceptRequired', 'Orderable concept is required'),
            invalid_type_error: t('addOrderableConceptRequired', 'Orderable concept is required'),
          },
        ),
      }),
    [t],
  );

  const {
    control,
    handleSubmit,
    formState: { errors, defaultValues, isDirty },
  } = useForm<MedicalSupplyOrderBasketItem>({
    mode: 'all',
    resolver: zodResolver(OrderFormSchema),
    defaultValues: {
      ...initialOrder,
    },
  });

  const filterItemsByName = useCallback((menu) => {
    return menu?.item?.value?.toLowerCase().includes(menu?.inputValue?.toLowerCase());
  }, []);

  const handleFormSubmission = useCallback(
    (data: MedicalSupplyOrderBasketItem) => {
      const finalizedOrder: MedicalSupplyOrderBasketItem = {
        ...initialOrder,
        ...data,
      };
      finalizedOrder.orderer = session.currentProvider.uuid;

      const newOrders = [...orders];
      const existingOrder = orders.find((order) => ordersEqual(order, finalizedOrder));

      if (existingOrder) {
        newOrders[orders.indexOf(existingOrder)] = {
          ...finalizedOrder,
          // Incomplete orders should be marked completed on saving the form
          isOrderIncomplete: false,
        };
      } else {
        newOrders.push(finalizedOrder);
      }

      setOrders(newOrders);

      closeWorkspaceWithSavedChanges({
        onWorkspaceClose: () => launchPatientWorkspace('order-basket'),
      });
    },
    [orders, setOrders, session?.currentProvider?.uuid, closeWorkspaceWithSavedChanges, initialOrder],
  );

  const cancelOrder = useCallback(() => {
    setOrders(orders.filter((order) => order.concept.uuid !== defaultValues.concept.conceptUuid));
    closeWorkspace({
      onWorkspaceClose: () => launchPatientWorkspace('order-basket'),
    });
  }, [closeWorkspace, orders, setOrders, defaultValues]);

  const onError = (errors: FieldErrors<MedicalSupplyOrderBasketItem>) => {
    if (errors) {
      setShowErrorNotification(true);
    }
  };

  useEffect(() => {
    promptBeforeClosing(() => isDirty);
  }, [isDirty, promptBeforeClosing]);

  const responsiveSize = isTablet ? 'lg' : 'sm';

  return (
    <>
      <Form className={styles.orderForm} onSubmit={handleSubmit(handleFormSubmission, onError)} id="drugOrderForm">
        <div className={styles.form}>
          <ExtensionSlot name="top-of-lab-order-form-slot" state={{ order: initialOrder }} />
          <Grid className={styles.gridRow}>
            <Column lg={16} md={8} sm={4}>
              <InputWrapper>
                <label className={styles.testTypeLabel}>{t('testType', 'Test type')}</label>
                <p className={styles.testType}>{initialOrder?.concept?.display}</p>
              </InputWrapper>
            </Column>
          </Grid>
          <Grid className={styles.gridRow}>
            <Column lg={16} md={8} sm={4}>
              <InputWrapper>
                <Controller
                  name="accessionNumber"
                  control={control}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      id="labReferenceNumberInput"
                      invalid={!!errors.accessionNumber}
                      invalidText={errors.accessionNumber?.message}
                      labelText={t('testOrderReferenceNumber', '{{orderType}} reference number', {
                        orderType: orderType?.display,
                      })}
                      maxLength={150}
                      onBlur={onBlur}
                      onChange={onChange}
                      size={responsiveSize}
                      value={value}
                    />
                  )}
                />
              </InputWrapper>
            </Column>
          </Grid>

          <Grid className={styles.gridRow}>
            <Column lg={16} md={8} sm={4}>
              <InputWrapper>
                <Controller
                  control={control}
                  name="quantity"
                  render={({ field, fieldState: { error } }) => (
                    <NumberInput
                      {...field}
                      id="quantity"
                      onChange={(e) =>
                        field.onChange(
                          e.target.value != '' && e.target.value != null ? parseInt(e.target.value) : undefined,
                        )
                      }
                      invalid={Boolean(error?.message)}
                      invalidText={error?.message}
                      label={t('quantity', 'Quantity')}
                      size={responsiveSize}
                      hideSteppers={!isTablet}
                    />
                  )}
                />
              </InputWrapper>
            </Column>
          </Grid>

          <Grid className={styles.gridRow}>
            <Column lg={16} md={8} sm={4}>
              <InputWrapper>
                {isLoadingQuantityUnits ? (
                  <SelectSkeleton />
                ) : errorFetchingQuantityUnits ? (
                  <InlineNotification
                    style={{ minWidth: '100%' }}
                    kind="error"
                    hideCloseButton
                    title={t('errorFetchingQuantityUnits', 'Error fetching quantity units')}
                    subtitle={t(
                      'errorFetchingQuantityUnitsDescription',
                      'Try launching the order form again or contact your administrator',
                    )}
                  />
                ) : (
                  <Controller
                    control={control}
                    name="quantityUnits"
                    render={({ field, fieldState: { error } }) => (
                      <ComboBox
                        // {...field}
                        items={concepts}
                        itemToString={(item: Concept) => item?.display}
                        id="quantity"
                        onChange={({ selectedItem }) => field.onChange(selectedItem)}
                        invalid={Boolean(error?.message)}
                        invalidText={error?.message}
                        titleText={t('quantityUnit', 'Quantity unit')}
                        selectedItem={concepts.find(({ uuid }) => uuid === field.value?.uuid)}
                        size={responsiveSize}
                      />
                    )}
                  />
                )}
              </InputWrapper>
            </Column>
          </Grid>

          <Grid className={styles.gridRow}>
            <Column lg={8} md={8} sm={4}>
              <InputWrapper>
                <Controller
                  name="urgency"
                  control={control}
                  render={({ field: { onBlur, onChange, value } }) => (
                    <ComboBox
                      id="priorityInput"
                      invalid={!!errors.urgency}
                      invalidText={errors.urgency?.message}
                      items={priorityOptions}
                      onBlur={onBlur}
                      onChange={({ selectedItem }) => onChange(selectedItem?.value || '')}
                      selectedItem={priorityOptions.find((option) => option.value === value) || null}
                      shouldFilterItem={filterItemsByName}
                      size={responsiveSize}
                      titleText={t('priority', 'Priority')}
                    />
                  )}
                />
              </InputWrapper>
            </Column>
          </Grid>
          <Grid className={styles.gridRow}>
            <Column lg={16} md={8} sm={4}>
              <InputWrapper>
                <Controller
                  name="instructions"
                  control={control}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextArea
                      enableCounter
                      id="additionalInstructionsInput"
                      invalid={!!errors.instructions}
                      invalidText={errors.instructions?.message}
                      labelText={t('additionalInstructions', 'Additional instructions')}
                      maxCount={500}
                      onBlur={onBlur}
                      onChange={onChange}
                      size={responsiveSize}
                      value={value}
                    />
                  )}
                />
              </InputWrapper>
            </Column>
          </Grid>
        </div>
        <div>
          {showErrorNotification && (
            <Column className={styles.errorContainer}>
              <InlineNotification
                lowContrast
                onClose={() => setShowErrorNotification(false)}
                subtitle={t('pleaseRequiredFields', 'Please fill all required fields') + '.'}
                title={t('error', 'Error')}
              />
            </Column>
          )}
          <ButtonSet
            className={classNames(styles.buttonSet, isTablet ? styles.tabletButtonSet : styles.desktopButtonSet)}
          >
            <Button className={styles.button} kind="secondary" onClick={cancelOrder} size="xl">
              {t('discard', 'Discard')}
            </Button>
            <Button
              className={styles.button}
              kind="primary"
              size="xl"
              type="submit"
              disabled={Boolean(errorFetchingQuantityUnits)}
            >
              {t('saveOrder', 'Save order')}
            </Button>
          </ButtonSet>
        </div>
      </Form>
    </>
  );
}

function InputWrapper({ children }) {
  const isTablet = useLayoutType() === 'tablet';
  return (
    <Layer level={isTablet ? 1 : 0}>
      <div className={styles.field}>{children}</div>
    </Layer>
  );
}
