import { Type, validator, validators } from '@openmrs/esm-framework';
import _default from 'react-hook-form/dist/utils/createSubject';

export const configSchema = {
  orderTypes: {
    _type: Type.Array,
    _elements: {
      _type: Type.Object,
      orderTypeUuid: {
        _type: Type.UUID,
        _description: 'The UUID of the order type with the listed in the order basket',
      },
      orderableConceptSets: {
        _type: Type.Array,
        _description:
          "UUIDs of concepts that represent orderable concepts. Either the `conceptClass` should be given, or the `orderableConcepts`. If the orderableConcepts are not given, then it'll search concepts by concept class.",
        _elements: {
          _type: Type.UUID,
        },
      },
    },
    _default: [
      {
        orderTypeUuid: '67a92bd6-0f88-11ea-8d71-362b9e155667',
        orderableConceptSets: ['4b573f1d-beb1-401a-92c3-b40409694f98'],
      },
    ],
  },
  quantityUnits: {
    _type: Type.Object,
    _description: 'Concept to be used for fetching quantity units',
    _default: {
      conceptUuid: '162402AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      map: 'setMembers',
    },
    conceptUuid: {
      _type: Type.UUID,
      _description: 'UUID for the quantity units concepts',
      _default: '162402AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
    },
    map: {
      _type: Type.UUID,
      _description:
        "Whether to use the concept answers of the setMembers of the concept. One of 'answers' or 'setMembers'.",
      _default: 'setMembers',
      _validators: [validators.oneOf(['answers', 'setMembers'])],
    },
  },
};

export type ConfigObject = {
  orderTypes: Array<{
    orderTypeUuid: string;
    orderableConceptSets: Array<string>;
  }>;
  quantityUnits: {
    conceptUuid: string;
    map: 'answers' | 'setMembers';
  };
};
