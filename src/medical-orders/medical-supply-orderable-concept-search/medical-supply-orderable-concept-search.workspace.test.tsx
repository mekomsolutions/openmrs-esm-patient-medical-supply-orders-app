import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { launchWorkspace2, Workspace2 } from '@openmrs/esm-framework';
import { useOrderBasket } from '@openmrs/esm-patient-common-lib';
import OrderableConceptSearchWorkspace from './medical-supply-orderable-concept-search.workspace';

jest.mock('@carbon/react', () => ({
  Button: ({ children, onClick }) => <button onClick={onClick}>{children}</button>,
}));

jest.mock('@openmrs/esm-framework', () => ({
  ArrowLeftIcon: () => null,
  Workspace2: jest.fn(({ children }) => <div>{children}</div>),
  launchWorkspace2: jest.fn(),
  useConfig: () => ({ orderTypes: [{ orderTypeUuid: 'medical-supply', orderableConceptSets: [] }] }),
  useLayoutType: () => 'desktop',
}));

jest.mock('@openmrs/esm-patient-common-lib', () => ({
  useOrderBasket: jest.fn(() => ({ orders: [] })),
  useOrderType: () => ({ orderType: { display: 'Medical supply' } }),
}));

jest.mock('../resources', () => ({ prepOrderPostData: jest.fn() }));
jest.mock('./search-results.component', () => () => null);
jest.mock('../medical-supply-order-form/medical-supply-order-form.component', () => ({
  OrderForm: ({ setHasUnsavedChanges, returnToOrderBasket }) => (
    <>
      <button onClick={() => setHasUnsavedChanges(true)}>Edit order</button>
      <button onClick={() => returnToOrderBasket({ discardUnsavedChanges: true })}>Save order</button>
    </>
  ),
}));

const patient: fhir.Patient = { resourceType: 'Patient', id: 'patient-uuid' };
const groupProps = { patient, patientUuid: patient.id, visitContext: null, mutateVisitContext: jest.fn() };
const windowProps = { encounterUuid: 'encounter-uuid' };
const closeWorkspace = jest.fn();
const workspaceProps = {
  orderTypeUuid: 'medical-supply',
  order: { action: 'NEW' as const, display: 'Gauze', concept: { uuid: 'gauze', display: 'Gauze' }, visit: null },
};

function renderWorkspace() {
  return render(
    <OrderableConceptSearchWorkspace
      launchChildWorkspace={jest.fn()}
      workspaceName="medical-supply-orderable-concept-workspace"
      windowName="patient-chart-order-basket"
      isRootWorkspace
      showActionMenu={false}
      workspaceProps={workspaceProps}
      windowProps={windowProps}
      groupProps={groupProps}
      closeWorkspace={closeWorkspace}
    />,
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  closeWorkspace.mockResolvedValue(true);
});

it('uses the workspace patient for the order basket and tracks unsaved form changes', () => {
  renderWorkspace();

  expect(useOrderBasket).toHaveBeenCalledWith(patient, 'medical-supply', expect.any(Function));
  expect(jest.mocked(Workspace2).mock.lastCall[0].hasUnsavedChanges).toBe(false);

  fireEvent.click(screen.getByRole('button', { name: 'Edit order' }));

  expect(jest.mocked(Workspace2).mock.lastCall[0].hasUnsavedChanges).toBe(true);
});

it('preserves patient and encounter context when returning to the order basket', async () => {
  renderWorkspace();

  fireEvent.click(screen.getByRole('button', { name: 'Back to order basket' }));

  await waitFor(() => expect(launchWorkspace2).toHaveBeenCalledWith('order-basket', null, windowProps, groupProps));
  expect(closeWorkspace).toHaveBeenCalledWith(undefined);
});

it('keeps the workspace open when closing is declined', async () => {
  closeWorkspace.mockResolvedValue(false);
  renderWorkspace();

  fireEvent.click(screen.getByRole('button', { name: 'Back to order basket' }));

  await waitFor(() => expect(closeWorkspace).toHaveBeenCalled());
  expect(launchWorkspace2).not.toHaveBeenCalled();
});

it('returns after saving without prompting for unsaved changes', async () => {
  renderWorkspace();

  fireEvent.click(screen.getByRole('button', { name: 'Save order' }));

  await waitFor(() => expect(launchWorkspace2).toHaveBeenCalledWith('order-basket', null, windowProps, groupProps));
  expect(closeWorkspace).toHaveBeenCalledWith({ discardUnsavedChanges: true });
});
