import {
  declaredLineValue,
  persistedQtyFromQuantity,
  qtyFromApiScalar
} from '../components/survey/items/dynamic/itemFieldMapping';

describe('itemFieldMapping', () => {
  describe('declaredLineValue', () => {
    it('parses price as line total (ignores qty semantics)', () => {
      expect(declaredLineValue('8500')).toBe(8500);
      expect(declaredLineValue('1,234')).toBe(1234);
      expect(declaredLineValue('')).toBe(0);
      expect(declaredLineValue(null)).toBe(0);
    });
  });

  describe('persistedQtyFromQuantity', () => {
    it('maps blank to null', () => {
      expect(persistedQtyFromQuantity('')).toBeNull();
      expect(persistedQtyFromQuantity('  ')).toBeNull();
      expect(persistedQtyFromQuantity(null)).toBeNull();
      expect(persistedQtyFromQuantity(undefined)).toBeNull();
    });

    it('maps non-empty to integer', () => {
      expect(persistedQtyFromQuantity('3')).toBe(3);
      expect(persistedQtyFromQuantity('0')).toBe(0);
    });
  });

  describe('qtyFromApiScalar', () => {
    it('maps missing to null', () => {
      expect(qtyFromApiScalar(undefined)).toBeNull();
      expect(qtyFromApiScalar(null)).toBeNull();
      expect(qtyFromApiScalar('')).toBeNull();
    });

    it('maps numeric input', () => {
      expect(qtyFromApiScalar(4)).toBe(4);
      expect(qtyFromApiScalar('2')).toBe(2);
      expect(qtyFromApiScalar(0)).toBe(0);
    });
  });
});
